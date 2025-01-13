from flask import Flask, request, jsonify
import os
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from app import create_app, db # import the app and db objects
from app.services.auth_service import add_guid # import the service method
from app.models.guid import GUID # import the GUID model

app = create_app() # use the create_app function from your existing file.

DISCORD_PUBLIC_KEY = "ae8c6b84a1f9841c08f47e53476b2a1d3ee9822512a77acbb8438ef0abd2940b" # Replace with your discord app public key

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
         elif command_name == 'addguid':
              # Extract GUID from command and store to database
             try:
                guid = data['data']['options'][0]['value']
                with app.app_context():
                    new_guid = add_guid(discord_user_id=user_id, guid=guid)
                    
                return jsonify({
                 "type": 4,
                 "data": {
                     "content": f"Your GUID has been set to {guid}!"
                   }
                })
             except Exception as e:
                print(e)
                return jsonify({
                 "type": 4,
                 "data": {
                     "content": "There was a problem setting your GUID"
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

@app.route('/linked-roles', methods=['POST'])
def linked_roles_verification():
  if not verify_signature(request):
      return "Invalid signature", 401
   
  data = request.get_json()
  print(data)

  # Access token provided by discord, which is useless for your purposes
  access_token = data.get('access_token')

  # Get the user ID from the request data
  discord_user_id = data['user']['id']
  
  with app.app_context():
        # Perform Verification Here
      # Check if there is a GUID for the user
      guid = GUID.query.filter_by(discord_user_id=discord_user_id).first()

      if guid:
          # User has a valid GUID, they should get the "verified" role
          return jsonify({
              "roles": [
                 "1328275705313755167" # Replace with an actual role ID that has a link to this app.
                ]
          })
      else:
        # Return empty list to not give any roles
        return jsonify({"roles": []})


if __name__ == '__main__':
   app.run(debug=True, port=8001)