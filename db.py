from pymongo import MongoClient

# Use local MongoDB
MONGO_URI = "mongodb://192.168.66.168:27017"
<<<<<<< HEAD

=======
>>>>>>> viren-branch

client = MongoClient(MONGO_URI)
db = client["draw_game"]         # database name
sessions_col = db["sessions"]    # collection name


if __name__ == "__main__":
# Insert a dummy session
    # sessions_col.insert_one({
    #     "_id": "TEST123",
    #     "players": [],
    #     "status": "waiting"
    # })

    # Read it back
    print("Sessions:")
    for session in sessions_col.find():
        print(session)