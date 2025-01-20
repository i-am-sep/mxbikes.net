import os
import sys

def clear_console():
    """Clears the console."""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_file_contents(directory="."):
    """Prints the contents of specified file types in a directory."""
    file_types = (".html", ".py", ".js", ".css", ".log", ".txt")

    for filename in os.listdir(directory):
        if filename.endswith(file_types):
            filepath = os.path.join(directory, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:  # Handles different encodings
                    print(f"--- {filename} ---\n")
                    print(f.read())
                    print("\n--- END OF {filename} ---\n\n")
            except UnicodeDecodeError:
                print(f"--- {filename} ---\n")
                print(f"Could not decode this file (it may be binary or a different encoding).\n") #Handles errors for non-text files
                print("\n--- END OF {filename} ---\n\n")
            except Exception as e:
                print(f"--- {filename} ---\n")
                print(f"Error while reading file: {e}\n")
                print("\n--- END OF {filename} ---\n\n")

if __name__ == "__main__":
    clear_console()
    print_file_contents()