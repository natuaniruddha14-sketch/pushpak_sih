import io
from typing import Union, Tuple
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


class ImagePreprocessor:
    """Image preprocessing pipeline for scanned mining documents and PDF pages."""

    @staticmethod
    def render_pdf_page_to_image(page, dpi: int = 300) -> Image.Image:
        """Render a PyMuPDF PDF page object to a high-DPI PIL RGB image."""
        zoom = dpi / 72.0
        import pymupdf
        matrix = pymupdf.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        return img

    @staticmethod
    def bytes_to_image(image_bytes: bytes) -> Image.Image:
        """Load image bytes into PIL Image."""
        return Image.open(io.BytesIO(image_bytes))

    @classmethod
    def preprocess_image(
        cls,
        image: Image.Image,
        contrast_factor: float = 1.8,
        binarize_threshold: int = 140
    ) -> Image.Image:
        """
        Execute scanned document image preprocessing pipeline:
        1. Grayscale conversion
        2. Contrast enhancement
        3. Autocontrast adjustment
        4. Binarization thresholding
        5. Noise sharpening
        """
        # 1. Convert to Grayscale
        gray_img = image.convert("L")

        # 2. Autocontrast
        ac_img = ImageOps.autocontrast(gray_img, cutoff=2)

        # 3. Contrast enhancement
        enhancer = ImageEnhance.Contrast(ac_img)
        enhanced_img = enhancer.enhance(contrast_factor)

        # 4. Sharpening filter for crisp text edges
        sharpened_img = enhanced_img.filter(ImageFilter.SHARPEN)

        # 5. Thresholding / Binarization
        fn = lambda x: 255 if x > binarize_threshold else 0
        binarized_img = sharpened_img.point(fn, mode="1").convert("L")

        return binarized_img
