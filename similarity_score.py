from skimage.metrics import structural_similarity as ssim
import cv2

def calculate_similarity(image1_path):
    """
    Calculate the similarity score between two images using SSIM.

    Args:
        image1_path (str): Path to the first image.
        image2_path (str): Path to the second image.

    Returns:
        float: Similarity score between 0 and 1, where 1 means identical images.
    """
    # Load images

    main_image = r"C:\Users\kpanchal\PycharmProjects\temp\static\real_image.png"
    try:
        img1 = cv2.imread(image1_path, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imread(main_image, cv2.IMREAD_GRAYSCALE)
    except Exception as e:
        raise ValueError(f"Error loading images: {e}")

    if img1 is None or img2 is None:
        raise ValueError("One or both images could not be loaded. Check the file paths.")

    # Resize images to the same size if necessary
    if img1.shape != img2.shape:
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))

    # Calculate SSIM
    score, _ = ssim(img1, img2, full=True)

    print(f'Similarity scores of  {image1_path} : {score}')

    return score

if __name__ == "__main__":

    image_path = r"C:\Users\kpanchal\PycharmProjects\temp\static\given_image.png"
    score = calculate_similarity(image_path)
    print(f"Similarity score: {score}")