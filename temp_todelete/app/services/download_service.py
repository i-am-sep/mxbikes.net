from ..models.product import Product
from ..models.download import Download
from ..extensions import db
from datetime import datetime
import os

def authorize_download(product_id):
    product = Product.query.get(product_id)
    
    # Check if product exists and requires a password
    if not product or not product.password_release_time:
        return False, None  # Product not found or no password required

    # Check if the password release time has been met
    if datetime.utcnow() < product.password_release_time:
        return False, None  # Password release time not yet met

    # Logic to check if the user has purchased/authorized the download
    # This is a placeholder, you'll need to implement the actual authorization logic
    # For example, check if there's a record in the Download table for this user and product
    
    # Placeholder: Assume user_id is obtained from the authenticated user session
    # Replace this with your actual authentication logic to get the current user's ID
    user_id = get_current_user_id()  # This is a hypothetical function to get the current user's ID

    # Check if the user has a valid download record for this product
    download_record = Download.query.filter_by(user_id=user_id, product_id=product_id).first()
    if not download_record:
        return False, None  # User not authorized for this download

    # In a real scenario, you might want to check other conditions here,
    # such as whether the download link has expired, etc.

    # If all checks pass, return True and the password
    # Replace this with the actual password retrieval logic
    password = get_password_for_product(product_id)  # Hypothetical function to get the password
    return True, password

def get_password_for_product(product_id):
    # This is a placeholder function.
    # In a real application, you would retrieve the password associated with the product.
    # For example, you might have a field in the Product model, or a separate table for passwords.
    # Important: Passwords should be stored securely, and you should never hardcode them.
    # This is just an illustrative example.
    if product_id == 1:
        return "example_password_1"
    elif product_id == 2:
        return "example_password_2"
    else:
        return None  # Or raise an exception if appropriate

def get_current_user_id():
    # This is a placeholder function.
    # In a real application, you would retrieve the ID of the currently authenticated user.
    # This typically involves checking the user's session or a JWT token.
    # For demonstration purposes, it returns a static value.
    return 1  # Replace with actual logic to retrieve the current user's ID

def get_download_path(product_id, paid):
    product = Product.query.get(product_id)
    if product:
        if paid or product.mod_type == 'free':
            # Ensure the path is relative to the app's root and doesn't contain any ".."
            relative_path = os.path.relpath(product.file_path, start=os.path.sep)
            if relative_path.startswith('.'):
                return None  # Or handle the error as appropriate
            return relative_path
    return None