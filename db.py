from pymongo import MongoClient

# Use local MongoDB
MONGO_URI = "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)
db = client["draw_game"]         # database name
sessions_col = db["sessions"]    # collection name


if __name__ == "__main__":

    print("Sessions:")
    for session in sessions_col.find():
        print(session)

