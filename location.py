from mysql.connector import connect, Error

def save_user_location(user_id, latitude, longitude):
    """Save the latitude and longitude for the given user to the database."""
    try:
        # Connect to the database
        connection = connect(
            host='localhost',
            user='root',
            password='root1234',
            database='wind_wave_direction'
        )
        cursor = connection.cursor()

        # Update the user's location
        cursor.execute('''UPDATE user
                          SET latitude = %s, longitude = %s
                          WHERE id = %s''', (latitude, longitude, user_id))

        # Commit the transaction
        connection.commit()

        # Check if any rows were updated
        if cursor.rowcount == 0:
            return {'success': False, 'message': 'No user found with the given ID.'}

        return {'success': True, 'message': 'Location saved successfully!'}

    except Error as e:
        print(f"[ERROR] Database error: {e}")
        return {'success': False, 'message': f'Error saving location: {e}'}

    finally:
        # Close the connection
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
