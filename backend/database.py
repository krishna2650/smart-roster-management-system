import os
import json
import re
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import Config

class MockCursor:
    def __init__(self, items):
        self.items = items
        self._index = 0

    def __iter__(self):
        return iter(self.items)

    def __getitem__(self, index):
        return self.items[index]

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            key = key_or_list[0][0]
            direction = key_or_list[0][1]
        else:
            key = key_or_list
        reverse = (direction == -1)
        self.items.sort(key=lambda x: (x.get(key) is not None, x.get(key)), reverse=reverse)
        return self

    def limit(self, n):
        self.items = self.items[:n]
        return self

    def skip(self, n):
        self.items = self.items[n:]
        return self

class MockCollection:
    def __init__(self, name, db_store):
        self.name = name
        self.db_store = db_store
        if self.name not in self.db_store.data:
            self.db_store.data[self.name] = []

    @property
    def docs(self):
        return self.db_store.data[self.name]

    def _matches_filter(self, doc, filter_dict):
        if not filter_dict:
            return True
        for key, expected in filter_dict.items():
            if key == "$or":
                if not any(self._matches_filter(doc, sub) for sub in expected):
                    return False
                continue
            if key == "$and":
                if not all(self._matches_filter(doc, sub) for sub in expected):
                    return False
                continue
            
            actual = doc.get(key)
            if isinstance(expected, dict):
                for op, val in expected.items():
                    if op == "$in":
                        if str(actual) not in [str(v) for v in val] and actual not in val:
                            return False
                    elif op == "$nin":
                        if str(actual) in [str(v) for v in val] or actual in val:
                            return False
                    elif op == "$ne":
                        if str(actual) == str(val):
                            return False
                    elif op == "$regex":
                        pattern = re.compile(val, re.IGNORECASE)
                        if not actual or not pattern.search(str(actual)):
                            return False
                    elif op == "$gt":
                        if actual is None or actual <= val:
                            return False
                    elif op == "$gte":
                        if actual is None or actual < val:
                            return False
                    elif op == "$lt":
                        if actual is None or actual >= val:
                            return False
                    elif op == "$lte":
                        if actual is None or actual > val:
                            return False
            else:
                # Direct equality check (handling ObjectId / string equality)
                if isinstance(expected, ObjectId) or isinstance(actual, ObjectId):
                    if str(actual) != str(expected):
                        return False
                elif actual != expected:
                    return False
        return True

    def find(self, filter_dict=None, projection=None):
        filter_dict = filter_dict or {}
        matched = []
        for doc in self.docs:
            if self._matches_filter(doc, filter_dict):
                copy_doc = dict(doc)
                matched.append(copy_doc)
        return MockCursor(matched)

    def find_one(self, filter_dict=None):
        filter_dict = filter_dict or {}
        for doc in self.docs:
            if self._matches_filter(doc, filter_dict):
                return dict(doc)
        return None

    def insert_one(self, doc):
        new_doc = dict(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = ObjectId()
        elif isinstance(new_doc["_id"], str):
            try:
                new_doc["_id"] = ObjectId(new_doc["_id"])
            except Exception:
                pass
        self.docs.append(new_doc)
        self.db_store.save()
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(new_doc["_id"])

    def insert_many(self, doc_list):
        inserted_ids = []
        for d in doc_list:
            new_doc = dict(d)
            if "_id" not in new_doc:
                new_doc["_id"] = ObjectId()
            elif isinstance(new_doc["_id"], str):
                try:
                    new_doc["_id"] = ObjectId(new_doc["_id"])
                except Exception:
                    pass
            self.docs.append(new_doc)
            inserted_ids.append(new_doc["_id"])
        if inserted_ids:
            self.db_store.save()
        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(inserted_ids)

    def update_one(self, filter_dict, update_dict, upsert=False):
        matched = 0
        modified = 0
        for doc in self.docs:
            if self._matches_filter(doc, filter_dict):
                matched = 1
                if "$set" in update_dict:
                    for k, v in update_dict["$set"].items():
                        doc[k] = v
                    modified = 1
                if "$push" in update_dict:
                    for k, v in update_dict["$push"].items():
                        if k not in doc or not isinstance(doc[k], list):
                            doc[k] = []
                        doc[k].append(v)
                    modified = 1
                if "$pull" in update_dict:
                    for k, v in update_dict["$pull"].items():
                        if k in doc and isinstance(doc[k], list):
                            doc[k] = [x for x in doc[k] if str(x) != str(v)]
                    modified = 1
                self.db_store.save()
                break
        
        if matched == 0 and upsert:
            new_doc = dict(filter_dict)
            if "$set" in update_dict:
                new_doc.update(update_dict["$set"])
            self.insert_one(new_doc)
            matched = 1
            modified = 1

        class UpdateResult:
            def __init__(self, m, mod):
                self.matched_count = m
                self.modified_count = mod
        return UpdateResult(matched, modified)

    def update_many(self, filter_dict, update_dict):
        matched = 0
        modified = 0
        for doc in self.docs:
            if self._matches_filter(doc, filter_dict):
                matched += 1
                if "$set" in update_dict:
                    for k, v in update_dict["$set"].items():
                        doc[k] = v
                    modified += 1
        if modified > 0:
            self.db_store.save()
        class UpdateResult:
            def __init__(self, m, mod):
                self.matched_count = m
                self.modified_count = mod
        return UpdateResult(matched, modified)

    def delete_one(self, filter_dict):
        deleted = 0
        for i, doc in enumerate(self.docs):
            if self._matches_filter(doc, filter_dict):
                del self.docs[i]
                deleted = 1
                self.db_store.save()
                break
        class DeleteResult:
            def __init__(self, d):
                self.deleted_count = d
        return DeleteResult(deleted)

    def delete_many(self, filter_dict):
        before = len(self.docs)
        self.db_store.data[self.name] = [
            doc for doc in self.docs if not self._matches_filter(doc, filter_dict)
        ]
        deleted = before - len(self.db_store.data[self.name])
        if deleted > 0:
            self.db_store.save()
        class DeleteResult:
            def __init__(self, d):
                self.deleted_count = d
        return DeleteResult(deleted)

    def count_documents(self, filter_dict=None):
        filter_dict = filter_dict or {}
        return len([doc for doc in self.docs if self._matches_filter(doc, filter_dict)])

    def create_index(self, *args, **kwargs):
        pass

    def distinct(self, key, filter_dict=None):
        filter_dict = filter_dict or {}
        results = set()
        for doc in self.docs:
            if self._matches_filter(doc, filter_dict) and key in doc:
                val = doc[key]
                if isinstance(val, list):
                    for v in val:
                        results.add(v)
                else:
                    results.add(val)
        return list(results)

class FallbackDBStore:
    def __init__(self, storage_path="backend_data.json"):
        self.storage_path = os.path.join(os.path.dirname(__file__), storage_path)
        self.data = {}
        self.load()

    def load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    for col, docs in raw.items():
                        self.data[col] = []
                        for d in docs:
                            item = dict(d)
                            if "_id" in item and isinstance(item["_id"], str):
                                try:
                                    item["_id"] = ObjectId(item["_id"])
                                except Exception:
                                    pass
                            # convert nested object ids if needed
                            for k in ["employee_id", "brand_id", "process_id", "pod_id", "pod_lead_id", "roster_id"]:
                                if k in item and isinstance(item[k], str) and len(item[k]) == 24:
                                    try:
                                        item[k] = ObjectId(item[k])
                                    except Exception:
                                        pass
                            self.data[col].append(item)
            except Exception as e:
                print(f"[FallbackDBStore] Error reading storage: {e}")
                self.data = {}

    def save(self):
        try:
            serialized = {}
            for col, docs in self.data.items():
                serialized[col] = []
                for d in docs:
                    item = dict(d)
                    for k, v in list(item.items()):
                        if isinstance(v, ObjectId):
                            item[k] = str(v)
                        elif isinstance(v, list):
                            item[k] = [str(x) if isinstance(x, ObjectId) else x for x in v]
                        elif isinstance(v, datetime):
                            item[k] = v.isoformat()
                    serialized[col].append(item)
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(serialized, f, separators=(',', ':'), default=str)
        except Exception as e:
            print(f"[FallbackDBStore] Error saving storage: {e}")

    def __getitem__(self, col_name):
        return MockCollection(col_name, self)

class Database:
    client = None
    db = None
    is_fallback = False

    @classmethod
    def get_db(cls):
        if cls.db is not None:
            return cls.db

        mongo_uri = Config.MONGO_URI
        # Check if remote or local MongoClient is available
        try:
            print(f"Connecting to MongoDB at: {mongo_uri}")
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=400, connectTimeoutMS=400)
            client.admin.command('ping')
            cls.client = client
            cls.db = client[Config.DB_NAME]
            cls.is_fallback = False
            print("Successfully connected to live MongoDB!")
            return cls.db
        except Exception as e:
            if 'client' in locals() and client:
                try:
                    client.close()
                except Exception:
                    pass
            print(f"MongoDB connection failed ({e}). Falling back to high-fidelity persistent local store.")
            cls.db = FallbackDBStore()
            cls.is_fallback = True
            return cls.db

def get_db():
    return Database.get_db()
