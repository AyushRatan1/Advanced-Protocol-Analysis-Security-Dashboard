def prepare_key(key):
    """
    Prepare the key for Playfair cipher by removing duplicates and creating the 5x5 matrix.
    """
    # Convert to uppercase and remove spaces
    key = key.upper().replace(" ", "")
    
    # Replace J with I (standard in Playfair)
    key = key.replace("J", "I")
    
    # Create key matrix (5x5)
    alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"  # Note: I/J are combined
    key_matrix = []
    
    # Add key characters first (without duplicates)
    for char in key:
        if char in alphabet and char not in key_matrix:
            key_matrix.append(char)
    
    # Add remaining alphabet characters
    for char in alphabet:
        if char not in key_matrix:
            key_matrix.append(char)
    
    # Convert to 5x5 matrix representation
    matrix = [key_matrix[i:i+5] for i in range(0, 25, 5)]
    return matrix

def find_position(matrix, char):
    """Find the row and column of a character in the matrix."""
    for i in range(5):
        for j in range(5):
            if matrix[i][j] == char:
                return i, j
    return -1, -1

def prepare_text(text):
    """Prepare the plaintext for encryption."""
    # Convert to uppercase and remove spaces and non-alphabetic characters
    text = ''.join(char for char in text.upper() if char.isalpha())
    
    # Replace J with I
    text = text.replace("J", "I")
    
    # Insert X between double letters and ensure even length
    result = []
    i = 0
    while i < len(text):
        if i == len(text) - 1:
            result.append(text[i] + 'X')
            i += 1
        elif text[i] == text[i+1]:
            result.append(text[i] + 'X')
            i += 1
        else:
            result.append(text[i] + text[i+1])
            i += 2
    
    return result

def encrypt(plaintext, key):
    """Encrypt using Playfair cipher."""
    matrix = prepare_key(key)
    digraphs = prepare_text(plaintext)
    result = []
    
    for pair in digraphs:
        a, b = pair[0], pair[1]
        row_a, col_a = find_position(matrix, a)
        row_b, col_b = find_position(matrix, b)
        
        # Same row
        if row_a == row_b:
            result.append(matrix[row_a][(col_a + 1) % 5] + matrix[row_b][(col_b + 1) % 5])
        # Same column
        elif col_a == col_b:
            result.append(matrix[(row_a + 1) % 5][col_a] + matrix[(row_b + 1) % 5][col_b])
        # Rectangle
        else:
            result.append(matrix[row_a][col_b] + matrix[row_b][col_a])
    
    return ''.join(result)

def decrypt(ciphertext, key):
    """Decrypt using Playfair cipher."""
    matrix = prepare_key(key)
    
    # Split ciphertext into digraphs
    digraphs = [ciphertext[i:i+2] for i in range(0, len(ciphertext), 2)]
    result = []
    
    for pair in digraphs:
        if len(pair) < 2:  # Handle odd length (shouldn't happen in proper Playfair)
            continue
            
        a, b = pair[0], pair[1]
        row_a, col_a = find_position(matrix, a)
        row_b, col_b = find_position(matrix, b)
        
        # Same row
        if row_a == row_b:
            result.append(matrix[row_a][(col_a - 1) % 5] + matrix[row_b][(col_b - 1) % 5])
        # Same column
        elif col_a == col_b:
            result.append(matrix[(row_a - 1) % 5][col_a] + matrix[(row_b - 1) % 5][col_b])
        # Rectangle
        else:
            result.append(matrix[row_a][col_b] + matrix[row_b][col_a])
    
    return ''.join(result)

def display_matrix(key):
    """Display the 5x5 matrix for the given key."""
    matrix = prepare_key(key)
    for row in matrix:
        print(' '.join(row))

if __name__ == "__main__":
    # Test the Playfair cipher
    key = "KEYWORD"
    plaintext = "HELLO WORLD"
    
    print("Key Matrix:")
    display_matrix(key)
    
    encrypted = encrypt(plaintext, key)
    print(f"\nPlaintext: {plaintext}")
    print(f"Encrypted: {encrypted}")
    
    decrypted = decrypt(encrypted, key)
    print(f"Decrypted: {decrypted}") 