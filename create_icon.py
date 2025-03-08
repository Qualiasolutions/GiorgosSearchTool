import os
from PIL import Image, ImageDraw, ImageFont

def create_app_icon():
    """Create a simple icon for the application"""
    try:
        # Try to import PIL
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("PIL not found. Installing Pillow...")
        os.system("pip install pillow")
        from PIL import Image, ImageDraw, ImageFont
    
    # Create a new image with a size of 256x256 pixels
    icon_size = 256
    image = Image.new('RGBA', (icon_size, icon_size), (0, 164, 172, 255))  # #00A4AC color
    
    # Get a drawing context
    draw = ImageDraw.Draw(image)
    
    # Draw a search icon (simplified)
    # Draw circle for magnifying glass
    circle_center = (icon_size * 0.4, icon_size * 0.4)
    circle_radius = icon_size * 0.25
    circle_width = int(icon_size * 0.08)
    
    # Draw circle (outer edge)
    draw.ellipse(
        [(circle_center[0] - circle_radius, circle_center[1] - circle_radius),
         (circle_center[0] + circle_radius, circle_center[1] + circle_radius)],
        outline='white', width=circle_width)
    
    # Draw handle
    handle_width = int(icon_size * 0.08)
    draw.line(
        [(circle_center[0] + circle_radius * 0.7, circle_center[1] + circle_radius * 0.7),
         (icon_size * 0.75, icon_size * 0.75)],
        fill='white', width=handle_width)
    
    # Draw 'G' in the center
    try:
        font_size = int(icon_size * 0.25)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            # Use default font if Arial is not available
            font = ImageFont.load_default()
            font_size = int(icon_size * 0.15)  # Smaller size for default font
            
        # Center the text - use proper method for Pillow version
        text = "G"
        
        # Modern Pillow uses textbbox
        if hasattr(draw, 'textbbox'):
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        # Older Pillow versions
        elif hasattr(font, 'getsize'):
            text_width, text_height = font.getsize(text)
        else:
            # Fallback to estimated size
            text_width, text_height = font_size, font_size
        
        text_position = (
            int(circle_center[0] - text_width // 2), 
            int(circle_center[1] - text_height // 2)
        )
        draw.text(text_position, text, fill='white', font=font)
    except Exception as e:
        print(f"Error drawing text: {e}")
        # If text drawing fails, use a fallback circle
        draw.ellipse(
            [(circle_center[0] - circle_radius * 0.5, circle_center[1] - circle_radius * 0.5),
             (circle_center[0] + circle_radius * 0.5, circle_center[1] + circle_radius * 0.5)],
            fill='white')
    
    # Save the image as ICO
    try:
        image.save('app_icon.ico', format='ICO')
        print("Icon created: app_icon.ico")
    except Exception as e:
        print(f"Error saving icon: {e}")
        # Try to save as PNG as fallback
        try:
            image.save('app_icon.png')
            print("Icon created as PNG instead: app_icon.png")
        except:
            print("Could not create icon file.")

if __name__ == "__main__":
    create_app_icon() 