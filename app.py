from flask import Flask, request, jsonify
import os
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

app = Flask(__name__)
    
DISCORD_PUBLIC_KEY = "ae8c6b84a1f9841c08f47e53476b2a1d3ee9822512a77acbb8438ef0abd2940b"

def verify_signature(request):
  signature = request.headers.get("X-Signature-Ed25519")
  timestamp = request.headers.get("X-Signature-Timestamp")
  body = request.get_data(as_text=True)

  if signature is None or timestamp is None:
     return False

  try:
     verify_key = VerifyKey(bytes.fromhex(DISCORD_PUBLIC_KEY))
     verify_key.verify(f"{timestamp}{body}".encode(), bytes.fromhex(signature))
     return True
  except BadSignatureError:
    return False
   
@app.route('/discord', methods=['POST'])
def discord():
    if not verify_signature(request):
       return "Invalid signature", 401

    data = request.get_json()
    print(data)

    if data["type"] == 1:
        return jsonify({"type": 1})

    if data["type"] == 2:
         # Handle your command logic here
         command_name = data["data"]["name"]
         user_id = data["member"]["user"]["id"]
         
         if command_name == 'ping':
             return jsonify({
                 "type": 4,
                 "data": {
                     "content": f"Pong! from user: {user_id}"
                 }
            })
         else:
             return jsonify({
                    "type": 4,
                     "data": {
                    "content": f"I dont know how to handle {command_name} yet from user: {user_id}!"
                  }
                })
    return jsonify({"type": 1})

if __name__ == '__main__':
   app.run(debug=True, port=8001)
