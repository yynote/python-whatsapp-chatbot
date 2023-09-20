import pinecone
import pandas as pd
import openai
import os

from dotenv import load_dotenv
load_dotenv()

# pinecone.init(api_key=os.getenv("pinecone_key"))
pinecone.init(api_key=os.getenv("pinecone_key"), environment=os.getenv("pinecone_env"))
# pinecone.delete_index("hormozigpt")
print("init start")
# print(os.getenv("pinecone_key"), os.getenv("pinecone_env"))

print(pinecone.list_indexes())
pine_index_namd = "ai-chatbot-app"

# pinecone.create_index(
#     pine_index_namd, 
#     dimension=1536, 
#     metric="cosine", 
#     pod_type="p1"
# )

print("create success")

print(pinecone.list_indexes())
index = pinecone.Index(pine_index_namd)
print(index.describe_index_stats())
print("init complete")


# df = pd.read_csv("Backend/history.csv")
# print(df.head().count())
# openai.api_key = os.getenv("openai_key")


def get_embedding(text):
    response = openai.Embedding.create(
        input=text,
        model="text-embedding-ada-002"
    )

    return response['data'][0]['embedding']


def addData(index,url, title,context):
    my_id = index.describe_index_stats()['total_vector_count']

    chunkInfo = (str(my_id),
                 get_embedding(context),
                 {'video_url': url, 'title':title,'context':context})

    index.upsert(vectors=[chunkInfo])


# for indexx, row in df.iterrows():
#     addData(index,row["url"],row["title"],row["content"])
#     print("add data: ", row["content"])


print("Completed")