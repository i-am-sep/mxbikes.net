from app.extensions import db

class GUID(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    discord_user_id = db.Column(db.String(128), nullable=False)
    guid = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<GUID {self.guid}>'