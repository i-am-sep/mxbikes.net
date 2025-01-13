from ..extensions import db

class GUID(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    discord_user_id = db.Column(db.String(255), unique=True, nullable=False)
    guid = db.Column(db.String(255), nullable=False)

    def __init__(self, discord_user_id, guid):
        self.discord_user_id = discord_user_id
        self.guid = guid

    def __repr__(self):
        return f"<GUID(discord_user_id='{self.discord_user_id}', guid='{self.guid}')>"

    def to_dict(self):
      return {
            "id": self.id,
           "discord_user_id": self.discord_user_id,
           "guid": self.guid
           }