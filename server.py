from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
            
class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        SimpleHTTPRequestHandler.end_headers(self)

def run(server_class=HTTPServer, handler_class=CORSRequestHandler):
    static_path = os.path.join(os.path.dirname(__file__), 'static')
    os.chdir(static_path)
    server_address = ('', 8000)  # Port 8000
    httpd = server_class(server_address, handler_class)
    try:
        print(f"Server running on http://localhost:8000")
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        print("Server closed")

if __name__ == '__main__':
  run()