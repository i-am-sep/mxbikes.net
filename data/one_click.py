import tkinter as tk
from tkinter import messagebox
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

def update_database():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        prepopulate_path = os.path.join(script_dir, "..", "prepopulate.py")
        extract_path = os.path.join(script_dir, "..", "extract_track_details.py")
        merge_path = os.path.join(script_dir, "merge_track_data.py")

        subprocess.run(["python", prepopulate_path], check=True)
        subprocess.run(["python", extract_path], check=True)
        subprocess.run(["python", merge_path], check=True)
        subprocess.run(["flask", "db", "migrate", "-m", "Update track details"], check=True)
        subprocess.run(["flask", "db", "upgrade"], check=True)
        messagebox.showinfo("Success", "Database updated successfully!")
    except subprocess.CalledProcessError as e:
        messagebox.showerror("Error", f"An error occurred during script execution: {e}")
    except FileNotFoundError as e:
        messagebox.showerror("Error", f"A file was not found: {e}")
    except Exception as e:
        messagebox.showerror("Error", f"An unexpected error occurred: {e}")

root = tk.Tk()
root.title("Database Updater")
button = tk.Button(root, text="Update Database", command=update_database)
button.pack(pady=20)
root.mainloop()