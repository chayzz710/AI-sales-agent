#create a connection to MOongoDB and gives us a simple way to access it from anywhere in the backend. 
#has a small helper to convert mongo into jsoonn

from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("DB_NAME")]

def to_json(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

#def to_json for a list of docs
def to_json_list(docs):
    return [to_json(doc) for doc in docs]

#converts a string into a MOgoDB OnjectId - needed whnever we look uup a doc ID
def valid_id(id_string):
    try:
        return ObjectId(id_string)
    except:
        return None
