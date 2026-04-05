#!/usr/bin/env python3
"""Generate 5 wedding-themed background images using Pillow."""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import random
import math
import os

WIDTH, HEIGHT = 1440, 720
OUTPUT_DIR = "/home/z/my-project/public/images/backgrounds/"

def create_gradient(draw, width, height, color1, color2, direction="vertical"):
    """Draw a gradient across the image."""
    for i in range(height if direction == "vertical" else width):
        ratio = i / (height if direction == "vertical" else width)
        r = int(color1[0] + (color2[0] - color1[0]) * ratio)
        g = int(color1[1] + (color2[1] - color1[1]) * ratio)
        b = int(color1[2] + (color2[2] - color1[2]) * ratio)
        if direction == "vertical":
            draw.line([(0, i), (width, i)], fill=(r, g, b))
        else:
            draw.line([(i, 0), (i, height)], fill=(r, g, b))

def draw_bokeh(draw, width, height, count, colors, min_r=10, max_r=60):
    """Draw bokeh light circles."""
    for _ in range(count):
        x = random.randint(0, width)
        y = random.randint(0, height)
        r = random.randint(min_r, max_r)
        color = random.choice(colors)
        # Draw concentric circles for bokeh effect
        for ring in range(r, 0, -2):
            alpha = int(40 * (ring / r))
            c = (min(color[0], 255), min(color[1], 255), min(color[2], 255), alpha)
            draw.ellipse([x - ring, y - ring, x + ring, y + ring], outline=c, width=2)

def draw_vignette(img):
    """Add vignette effect."""
    vignette = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(vignette)
    cx, cy = img.size[0] // 2, img.size[1] // 2
    max_dist = math.sqrt(cx**2 + cy**2)
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            dist = math.sqrt((x - cx)**2 + (y - cy)**2)
            alpha = int(min(180, (dist / max_dist) * 250))
            draw.point((x, y), fill=(0, 0, 0, alpha))
    return Image.alpha_composite(img.convert('RGBA'), vignette)

def add_noise(img, amount=10):
    """Add subtle noise for texture."""
    noise = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(noise)
    for _ in range(img.size[0] * img.size[1] // 50):
        x = random.randint(0, img.size[0] - 1)
        y = random.randint(0, img.size[1] - 1)
        alpha = random.randint(0, amount)
        draw.point((x, y), fill=(255, 255, 255, alpha))
    return Image.alpha_composite(img.convert('RGBA'), noise)

def draw_gold_frame(draw, width, height, thickness=3):
    """Draw elegant gold border frame."""
    gold = (212, 168, 83)
    light_gold = (232, 194, 112)
    m = thickness
    draw.rectangle([m, m, width - m - 1, height - m - 1], outline=gold, width=1)
    draw.rectangle([m + 4, m + 4, width - m - 5, height - m - 5], outline=light_gold, width=1)

def draw_islamic_star(draw, cx, cy, size, color, alpha=60):
    """Draw an 8-pointed Islamic star."""
    points = []
    for i in range(16):
        angle = math.pi * i / 8 - math.pi / 2
        r = size if i % 2 == 0 else size * 0.5
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        points.append((x, y))
    c = (*color, alpha) if len(color) == 3 else color
    draw.polygon(points, fill=c)

def draw_chandelier(draw, cx, cy, width_scale=1.0):
    """Draw a simplified crystal chandelier shape."""
    gold = (212, 168, 83, 40)
    light_gold = (232, 194, 112, 30)
    bright_gold = (255, 223, 128, 50)

    # Central chain
    draw.line([(cx, cy - 80), (cx, cy - 120)], fill=gold, width=2)

    # Top cup
    draw.ellipse([cx - 15, cy - 125, cx + 15, cy - 115], outline=gold)

    # Main body - ornate curves
    # Left arm
    draw.line([(cx, cy - 80), (cx - 60, cy - 30)], fill=gold, width=2)
    draw.line([(cx - 60, cy - 30), (cx - 80, cy - 10)], fill=gold, width=2)
    # Right arm
    draw.line([(cx, cy - 80), (cx + 60, cy - 30)], fill=gold, width=2)
    draw.line([(cx + 60, cy - 30), (cx + 80, cy - 10)], fill=gold, width=2)

    # Swag curves
    for dx in [-40, -20, 0, 20, 40]:
        points = []
        for t in range(20):
            tt = t / 19
            x = cx + dx * (1 - tt * 0.3)
            y = cy - 80 + tt * 70 + math.sin(tt * math.pi) * 15
            points.append((x, y))
        if len(points) > 1:
            draw.line(points, fill=light_gold, width=1)

    # Crystal drops
    for dx in [-80, -60, -40, -20, 0, 20, 40, 60, 80]:
        drop_x = cx + dx * 0.9
        drop_y = cy - 10 + abs(dx) * 0.1
        for j in range(5):
            r = 3 - j * 0.5
            if r > 0:
                alpha = 25 + j * 5
                draw.ellipse(
                    [drop_x - r, drop_y + j * 5 - r, drop_x + r, drop_y + j * 5 + r],
                    outline=(*bright_gold[:3], alpha)
                )

    # Glow behind chandelier
    for r in range(100, 0, -3):
        alpha = int(8 * (r / 100))
        draw.ellipse([cx - r, cy - 80 - r // 2, cx + r, cy - 80 + r // 2],
                     fill=(255, 223, 128, alpha))


def generate_login_wedding_hall():
    """Image 1: Elegant wedding hall interior with chandeliers."""
    img = Image.new('RGBA', (WIDTH, HEIGHT), (10, 8, 15, 255))
    draw = ImageDraw.Draw(img)

    # Dark gradient background
    create_gradient(draw, WIDTH, HEIGHT, (15, 12, 20), (8, 5, 12))

    # Subtle warm ambient glow from center
    glow = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for r in range(500, 0, -5):
        alpha = int(20 * (r / 500))
        glow_draw.ellipse(
            [WIDTH // 2 - r, HEIGHT // 2 - r // 2, WIDTH // 2 + r, HEIGHT // 2 + r // 2],
            fill=(180, 140, 60, alpha)
        )
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Draw architectural columns (simplified)
    col_color = (40, 35, 50, 80)
    for x_pos in [100, 350, 1090, 1340]:
        draw.rectangle([x_pos, 50, x_pos + 30, HEIGHT - 50], fill=col_color)
        # Column capital
        draw.rectangle([x_pos - 10, 50, x_pos + 40, 70], fill=(50, 45, 60, 90))
        draw.rectangle([x_pos - 10, HEIGHT - 70, x_pos + 40, HEIGHT - 50], fill=(50, 45, 60, 90))

    # Draw chandeliers
    for cx in [420, 720, 1020]:
        draw_chandelier(draw, cx, 200)

    # Gold decorative arch at top
    arch_color = (212, 168, 83, 30)
    draw.arc([200, -100, 1240, 400], 0, 180, fill=arch_color, width=2)
    draw.arc([250, -80, 1190, 360], 0, 180, fill=(232, 194, 112, 20), width=1)

    # Floor reflection
    floor = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    floor_draw = ImageDraw.Draw(floor)
    for y in range(HEIGHT // 2, HEIGHT):
        ratio = (y - HEIGHT // 2) / (HEIGHT // 2)
        alpha = int(30 * ratio)
        floor_draw.line([(0, y), (WIDTH, y)], fill=(180, 140, 60, alpha))
    img = Image.alpha_composite(img, floor)

    # Bokeh warm lights
    draw = ImageDraw.Draw(img)
    bokeh_colors = [
        (255, 200, 80), (255, 180, 60), (230, 190, 100),
        (200, 160, 80), (255, 220, 120), (180, 140, 60)
    ]
    draw_bokeh(draw, WIDTH, HEIGHT, 80, bokeh_colors, min_r=5, max_r=40)

    # Gold frame
    draw_gold_frame(draw, WIDTH, HEIGHT)

    # Convert and save
    final = img.convert('RGB')
    final.save(os.path.join(OUTPUT_DIR, "login.png"), "PNG")
    print("✓ login.png - Wedding Hall")


def generate_dashboard_party_lights():
    """Image 2: Festive party lights and stage lighting."""
    img = Image.new('RGBA', (WIDTH, HEIGHT), (5, 5, 10, 255))
    draw = ImageDraw.Draw(img)

    # Dark venue background
    create_gradient(draw, WIDTH, HEIGHT, (8, 5, 15), (3, 2, 8))

    # Stage lighting beams from top
    beam_colors = [
        (255, 180, 50, 15),  # warm gold
        (255, 100, 50, 12),  # warm orange
        (255, 200, 80, 10),  # light gold
        (200, 80, 50, 10),   # deep amber
        (255, 160, 80, 12),  # amber
        (230, 120, 60, 10),  # dark gold
    ]

    for i, color in enumerate(beam_colors):
        cx = 100 + i * 250
        # Draw light beam triangle
        points = [
            (cx, 0),
            (cx - 120 + random.randint(-30, 30), HEIGHT),
            (cx + 120 + random.randint(-30, 30), HEIGHT)
        ]
        draw.polygon(points, fill=color)

    # Colorful bokeh - warm wedding colors
    bokeh_colors = [
        (255, 200, 80), (255, 180, 60), (255, 220, 100),
        (255, 150, 50), (230, 180, 80), (200, 160, 100),
        (255, 240, 180), (220, 170, 60)
    ]
    draw_bokeh(draw, WIDTH, HEIGHT, 150, bokeh_colors, min_r=3, max_r=50)

    # Add some larger prominent bokeh
    for _ in range(15):
        x = random.randint(50, WIDTH - 50)
        y = random.randint(50, HEIGHT - 50)
        r = random.randint(30, 70)
        color = random.choice(bokeh_colors)
        for ring in range(r, 0, -3):
            alpha = int(25 * (ring / r))
            draw.ellipse([x - ring, y - ring, x + ring, y + ring],
                        outline=(*color, alpha), width=2)
        # Bright center
        draw.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(*color, 60))

    # Subtle horizontal light streaks
    streak = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    streak_draw = ImageDraw.Draw(streak)
    for _ in range(8):
        y = random.randint(100, HEIGHT - 100)
        color = random.choice(bokeh_colors)
        for x in range(0, WIDTH, 2):
            alpha = int(15 * math.sin(x / 100) * math.sin(x / 200 + y))
            if alpha > 0:
                streak_draw.point((x, y), fill=(*color, alpha))
    img = Image.alpha_composite(img, streak)

    # Convert and save
    final = img.convert('RGB')
    final.save(os.path.join(OUTPUT_DIR, "dashboard.png"), "PNG")
    print("✓ dashboard.png - Party Lights")


def generate_control_wedding_entrance():
    """Image 3: Wedding entrance archway with flowers."""
    img = Image.new('RGBA', (WIDTH, HEIGHT), (8, 6, 12, 255))
    draw = ImageDraw.Draw(img)

    # Dark background with subtle gradient
    create_gradient(draw, WIDTH, HEIGHT, (12, 8, 16), (5, 3, 8))

    # Central warm glow
    glow = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for r in range(400, 0, -5):
        alpha = int(15 * (r / 400))
        glow_draw.ellipse(
            [WIDTH // 2 - r, HEIGHT // 2 - r // 2, WIDTH // 2 + r, HEIGHT // 2 + r // 2],
            fill=(200, 170, 100, alpha)
        )
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Draw archway frame
    arch_left = WIDTH // 2 - 200
    arch_right = WIDTH // 2 + 200
    arch_top = 40
    arch_bottom = HEIGHT - 40

    # Outer arch
    draw.rectangle([arch_left, arch_top + 100, arch_left + 15, arch_bottom], fill=(50, 40, 55, 100))
    draw.rectangle([arch_right - 15, arch_top + 100, arch_right, arch_bottom], fill=(50, 40, 55, 100))
    # Arch top curve
    for angle in range(-90, 91):
        rad = math.radians(angle)
        x = WIDTH // 2 + 200 * math.cos(rad)
        y = arch_top + 100 - 200 * math.sin(rad)
        draw.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(50, 40, 55, 100))

    # Golden decorations on arch
    gold_colors = [(212, 168, 83, 50), (232, 194, 112, 40), (200, 160, 70, 35)]
    for angle in range(-80, 81, 5):
        rad = math.radians(angle)
        x = WIDTH // 2 + 200 * math.cos(rad)
        y = arch_top + 100 - 200 * math.sin(rad)
        color = random.choice(gold_colors)
        r = random.randint(2, 5)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color)

    # Floral clusters on arch (simplified as circles)
    flower_colors = [
        (240, 240, 245, 40),  # white flowers
        (255, 250, 250, 35),  # cream
        (200, 180, 160, 30),  # taupe
        (220, 210, 200, 30),  # light
    ]
    # Left side flowers
    for _ in range(60):
        x = arch_left + random.randint(-40, 40)
        y = random.randint(arch_top + 80, arch_bottom - 20)
        r = random.randint(4, 12)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=random.choice(flower_colors))

    # Right side flowers
    for _ in range(60):
        x = arch_right + random.randint(-40, 40)
        y = random.randint(arch_top + 80, arch_bottom - 20)
        r = random.randint(4, 12)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=random.choice(flower_colors))

    # Top arch flowers
    for angle in range(-85, 86, 3):
        rad = math.radians(angle)
        for dr in range(3):
            x = WIDTH // 2 + (200 + dr * 8) * math.cos(rad) + random.randint(-8, 8)
            y = arch_top + 100 - (200 + dr * 8) * math.sin(rad) + random.randint(-8, 8)
            r = random.randint(3, 8)
            draw.ellipse([x - r, y - r, x + r, y + r], fill=random.choice(flower_colors))

    # Draping fabric effect (subtle)
    fabric = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    fabric_draw = ImageDraw.Draw(fabric)
    for i in range(-10, 11):
        x = WIDTH // 2 + i * 20
        points = []
        for y in range(arch_top + 100, arch_bottom):
            wave = math.sin(y / 40 + i) * (10 + abs(i) * 2)
            points.append((x + wave, y))
        if len(points) > 1:
            alpha = max(5, 20 - abs(i) * 2)
            fabric_draw.line(points, fill=(220, 200, 180, alpha), width=1)
    img = Image.alpha_composite(img, fabric)

    # Soft bokeh in background
    draw = ImageDraw.Draw(img)
    draw_bokeh(draw, WIDTH, HEIGHT, 40,
               [(255, 220, 150), (255, 200, 100), (200, 170, 100)],
               min_r=3, max_r=30)

    # Gold frame
    draw_gold_frame(draw, WIDTH, HEIGHT)

    final = img.convert('RGB')
    final.save(os.path.join(OUTPUT_DIR, "control.png"), "PNG")
    print("✓ control.png - Wedding Entrance")


def generate_customers_groom_portrait():
    """Image 4: Dark sophisticated background for groom portrait area."""
    img = Image.new('RGBA', (WIDTH, HEIGHT), (10, 8, 14, 255))
    draw = ImageDraw.Draw(img)

    # Deep dark gradient
    create_gradient(draw, WIDTH, HEIGHT, (15, 10, 18), (5, 3, 8))

    # Dramatic side lighting (golden accent from right)
    side_glow = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    side_draw = ImageDraw.Draw(side_glow)
    for x in range(WIDTH // 2, WIDTH):
        ratio = (x - WIDTH // 2) / (WIDTH // 2)
        for y in range(HEIGHT):
            center_dist = abs(y - HEIGHT // 2) / (HEIGHT // 2)
            alpha = int(25 * ratio * (1 - center_dist * 0.7))
            side_draw.point((x, y), fill=(200, 160, 60, alpha))
    img = Image.alpha_composite(img, side_glow)

    # Subtle cool light from left
    left_glow = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    left_draw = ImageDraw.Draw(left_glow)
    for x in range(0, WIDTH // 2):
        ratio = 1 - x / (WIDTH // 2)
        for y in range(HEIGHT):
            center_dist = abs(y - HEIGHT // 2) / (HEIGHT // 2)
            alpha = int(10 * ratio * (1 - center_dist * 0.8))
            left_draw.point((x, y), fill=(60, 70, 100, alpha))
    img = Image.alpha_composite(img, left_glow)

    draw = ImageDraw.Draw(img)

    # Draw subtle geometric pattern (masculine/sophisticated)
    pattern = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    pat_draw = ImageDraw.Draw(pattern)
    for i in range(0, WIDTH, 60):
        for j in range(0, HEIGHT, 60):
            if (i + j) % 120 == 0:
                pat_draw.line([(i, j), (i + 30, j + 30)], fill=(100, 80, 50, 8), width=1)
                pat_draw.line([(i + 30, j), (i, j + 30)], fill=(100, 80, 50, 8), width=1)
    img = Image.alpha_composite(img, pattern)

    # Golden accent lines
    draw = ImageDraw.Draw(img)
    for i in range(5):
        x = WIDTH - 200 + i * 40
        alpha = 30 - i * 5
        draw.line([(x, 0), (x + 20, HEIGHT)], fill=(212, 168, 83, max(alpha, 5)), width=1)

    # Scattered gold dust particles
    for _ in range(200):
        x = random.randint(0, WIDTH)
        y = random.randint(0, HEIGHT)
        # More particles near the right side (where golden light is)
        if x > WIDTH * 0.6:
            alpha = random.randint(10, 40)
        else:
            alpha = random.randint(5, 20)
        r = random.choice([1, 1, 1, 2])
        draw.ellipse([x, y, x + r, y + r], fill=(255, 223, 128, alpha))

    # Central focus glow
    focus = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    focus_draw = ImageDraw.Draw(focus)
    for r in range(300, 0, -5):
        alpha = int(12 * (r / 300))
        focus_draw.ellipse(
            [WIDTH // 2 - r, HEIGHT // 2 - r // 2, WIDTH // 2 + r, HEIGHT // 2 + r // 2],
            fill=(180, 150, 100, alpha)
        )
    img = Image.alpha_composite(img, focus)

    draw = ImageDraw.Draw(img)
    draw_gold_frame(draw, WIDTH, HEIGHT)

    final = img.convert('RGB')
    final.save(os.path.join(OUTPUT_DIR, "customers.png"), "PNG")
    print("✓ customers.png - Groom Portrait Background")


def generate_bookings_wedding_decorations():
    """Image 5: Wedding table decorations and setup."""
    img = Image.new('RGBA', (WIDTH, HEIGHT), (8, 6, 10, 255))
    draw = ImageDraw.Draw(img)

    # Warm dark gradient
    create_gradient(draw, WIDTH, HEIGHT, (15, 10, 12), (5, 3, 6))

    # Warm ambient glow from center-bottom (table area)
    glow = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for r in range(500, 0, -5):
        alpha = int(18 * (r / 500))
        glow_draw.ellipse(
            [WIDTH // 2 - r, HEIGHT // 2 + 100 - r // 2,
             WIDTH // 2 + r, HEIGHT // 2 + 100 + r // 2],
            fill=(220, 180, 100, alpha)
        )
    img = Image.alpha_composite(img, glow)

    # Fairy lights string effect
    draw = ImageDraw.Draw(img)
    light_y = 100
    for x in range(50, WIDTH - 50, 30):
        sag = 15 * math.sin(x / 80)
        ly = light_y + sag
        # String
        if x > 50:
            prev_sag = 15 * math.sin((x - 30) / 80)
            draw.line([(x - 30, light_y + prev_sag), (x, ly)], fill=(100, 80, 50, 30), width=1)
        # Light glow
        for r in range(12, 0, -2):
            alpha = int(30 * (r / 12))
            draw.ellipse([x - r, ly - r, x + r, ly + r], fill=(255, 220, 140, alpha))
        # Bright center
        draw.ellipse([x - 2, ly - 2, x + 2, ly + 2], fill=(255, 250, 200, 80))

    # Draw candle shapes (simplified)
    candle_positions = [
        (360, 400), (540, 380), (720, 370), (900, 380), (1080, 400),
        (450, 500), (630, 490), (810, 490), (990, 500)
    ]
    for cx, cy in candle_positions:
        # Candle body
        draw.rectangle([cx - 4, cy, cx + 4, cy + 30], fill=(230, 220, 200, 60))
        # Flame glow
        for r in range(25, 0, -3):
            alpha = int(20 * (r / 25))
            draw.ellipse([cx - r, cy - r - 10, cx + r, cy + r - 10], fill=(255, 200, 80, alpha))
        # Flame
        draw.ellipse([cx - 3, cy - 15, cx + 3, cy - 5], fill=(255, 220, 120, 90))

    # Draw rose/flower clusters (simplified circles)
    rose_colors = [
        (240, 235, 240, 35),  # white roses
        (245, 240, 235, 30),  # cream
        (235, 230, 240, 30),  # light
        (250, 245, 240, 25),  # very light
    ]
    # Table runner area with flowers
    for _ in range(80):
        x = random.randint(200, WIDTH - 200)
        y = random.randint(350, 550)
        r = random.randint(5, 15)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=random.choice(rose_colors))

    # Golden centerpieces
    gold_piece_colors = [(212, 168, 83, 40), (200, 155, 70, 35), (225, 180, 90, 30)]
    for cx in [360, 540, 720, 900, 1080]:
        for r in range(20, 0, -3):
            alpha = int(25 * (r / 20))
            draw.ellipse([cx - r, 340 - r, cx + r, 340 + r],
                        fill=(212, 168, 83, alpha))

    # Fabric draping effect at sides
    fabric = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    fabric_draw = ImageDraw.Draw(fabric)
    # Left drape
    for i in range(30):
        x = 50 + i * 3
        points = []
        for y in range(0, HEIGHT):
            wave = math.sin(y / 50 + i * 0.5) * 10
            points.append((x + wave, y))
        if len(points) > 1:
            fabric_draw.line(points, fill=(180, 160, 140, 12), width=2)
    # Right drape
    for i in range(30):
        x = WIDTH - 50 - i * 3
        points = []
        for y in range(0, HEIGHT):
            wave = math.sin(y / 50 + i * 0.5) * 10
            points.append((x + wave, y))
        if len(points) > 1:
            fabric_draw.line(points, fill=(180, 160, 140, 12), width=2)
    img = Image.alpha_composite(img, fabric)

    # Warm bokeh
    draw = ImageDraw.Draw(img)
    draw_bokeh(draw, WIDTH, HEIGHT, 60,
               [(255, 200, 100), (255, 220, 140), (240, 190, 80), (255, 180, 60)],
               min_r=3, max_r=35)

    draw_gold_frame(draw, WIDTH, HEIGHT)

    final = img.convert('RGB')
    final.save(os.path.join(OUTPUT_DIR, "bookings.png"), "PNG")
    print("✓ bookings.png - Wedding Decorations")


if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    random.seed(42)  # Reproducible results

    print("Generating 5 wedding-themed background images (1440x720)...")
    print("-" * 50)

    generate_login_wedding_hall()
    generate_dashboard_party_lights()
    generate_control_wedding_entrance()
    generate_customers_groom_portrait()
    generate_bookings_wedding_decorations()

    print("-" * 50)
    print("All 5 background images generated successfully!")
