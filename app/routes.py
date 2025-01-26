from flask import render_template, Blueprint

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/tracks')
def tracks():
    return render_template('tracks.html')

@main.route('/bikes')
def bikes():
    return render_template('bikes.html')

@main.route('/championship')
def championship():
    return render_template('championship.html')

@main.route('/ranked')
def ranked():
    return render_template('ranked.html')

@main.route('/rider')
def rider():
    return render_template('rider.html')

@main.route('/downloads')
def downloads():
    return render_template('downloads.html')
