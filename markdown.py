import os
import re

def extract_code_from_markdown(markdown_file):
    """
    Extracts code blocks from a markdown file and returns them as a dictionary.

    Args:
        markdown_file: Path to the markdown file.

    Returns:
        A dictionary where keys are filenames and values are the code content.
    """
    with open(markdown_file, 'r') as f:
        markdown_content = f.read()

    # Regular expression to find code blocks with filenames
    code_blocks = re.findall(r"(\w+\.(?:py|txt|md)) ---\n```python\n(.*?)\n```", markdown_content, re.DOTALL)

    code_dict = {}
    for filename, code in code_blocks:
        code_dict[filename.strip()] = code.strip()

    return code_dict

def write_code_to_files(code_dict, root_dir):
    """
    Writes code from a dictionary to corresponding files in the project.

    Args:
        code_dict: A dictionary where keys are filenames and values are code.
        root_dir: The root directory of the project.
    """
    for filename, code in code_dict.items():
        filepath = find_file(root_dir, filename)
        if filepath:
            with open(filepath, 'w') as f:
                f.write(code)
            print(f"Successfully wrote code to: {filepath}")
        else:
            print(f"Warning: Could not find file path for: {filename}")

def find_file(root_dir, filename):
    """
    Finds the full file path for a given filename in the project directory.

    Args:
        root_dir: The root directory to search in.
        filename: The name of the file to find.

    Returns:
        The full path to the file if found, otherwise None.
    """
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if filename in filenames:
            return os.path.join(dirpath, filename)
    return None

if __name__ == "__main__":
    root_directory = os.path.join(os.path.expanduser("~"), "Documents", "website")
    markdown_file_path = os.path.join(root_directory, "markdown.txt")

    code_dict = extract_code_from_markdown(markdown_file_path)
    write_code_to_files(code_dict, root_directory)