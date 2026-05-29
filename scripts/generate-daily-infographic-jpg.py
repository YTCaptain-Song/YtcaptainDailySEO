import json
import math
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
TIME_ZONE = ZoneInfo("Asia/Shanghai")
WIDTH = 1024
HEIGHT = 1536
BLUE = (42, 108, 246)
DEEP_BLUE = (18, 31, 58)
TEXT_BLUE = (23, 99, 232)
LIGHT_BLUE = (235, 244, 255)
LINE_BLUE = (201, 220, 255)


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/STHeiti Medium.ttc" if bold else "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def parse_date(value):
    return datetime.fromisoformat(value).astimezone(TIME_ZONE)


def date_key(value):
    return parse_date(value).strftime("%Y-%m-%d")


def rounded_shadow(base, box, radius, fill, outline=None, shadow=(28, 85, 191, 28)):
    x1, y1, x2, y2 = box
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(layer)
    layer_draw.rounded_rectangle((x1, y1 + 10, x2, y2 + 10), radius, fill=shadow)
    layer = layer.filter(ImageFilter.GaussianBlur(12))
    base.alpha_composite(layer)
    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle(box, radius, fill=fill, outline=outline, width=2 if outline else 1)


def text_width(draw, text, used_font):
    if not text:
        return 0
    return draw.textbbox((0, 0), text, font=used_font)[2]


def wrap(draw, text, used_font, max_width, max_lines):
    tokens = re.findall(r"[A-Za-z0-9+./-]+|.", text)
    lines = []
    current = ""
    for token in tokens:
        candidate = current + token
        if current and text_width(draw, candidate, used_font) > max_width:
            lines.append(current)
            current = token
            if len(lines) == max_lines:
                return lines
        else:
            current = candidate
    if current and len(lines) < max_lines:
        lines.append(current)
    return lines


def gradient_rect(draw, box, radius):
    x1, y1, x2, y2 = box
    w = x2 - x1
    h = y2 - y1
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for x in range(w):
        t = x / max(w - 1, 1)
        color = (
            round(30 + (47 - 30) * t),
            round(119 + (93 - 119) * t),
            round(255 + (244 - 255) * t),
            255,
        )
        gdraw.line((x, 0, x, h), fill=color)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), radius, fill=255)
    draw.bitmap((x1, y1), mask, fill=None)
    return grad, mask, (x1, y1)


def paste_gradient(base, box, radius):
    grad, mask, pos = gradient_rect(ImageDraw.Draw(base), box, radius)
    base.paste(grad, pos, mask)


def draw_icon(draw, kind, cx, cy):
    c = BLUE
    if kind == "google":
        draw.text((cx, cy - 43), "G", anchor="ma", font=font(66, True), fill=c)
    elif kind == "sem":
        draw.polygon([(cx - 32, cy + 10), (cx - 14, cy + 10), (cx + 30, cy - 12), (cx + 30, cy + 36), (cx - 14, cy + 16), (cx - 32, cy + 16)], outline=c, fill=None)
        draw.line((cx - 9, cy + 18, cx + 1, cy + 43), fill=c, width=6)
        draw.arc((cx + 20, cy - 12, cx + 58, cy + 34), -50, 50, fill=c, width=6)
    elif kind == "tech":
        draw.rounded_rectangle((cx - 31, cy - 27, cx + 31, cy + 27), 7, outline=c, width=6)
        draw.line((cx - 16, cy - 7, cx + 16, cy - 7), fill=c, width=6)
        draw.line((cx - 16, cy + 9, cx + 8, cy + 9), fill=c, width=6)
    elif kind == "growth":
        for offset, h in [(-28, 28), (-4, 42), (20, 62)]:
            draw.line((cx + offset, cy + 32, cx + offset, cy + 32 - h), fill=c, width=7)
        draw.line((cx - 37, cy - 2, cx - 12, cy + 13, cx + 16, cy - 23, cx + 38, cy - 8), fill=c, width=7)
        draw.line((cx + 38, cy - 8, cx + 38, cy - 31, cx + 15, cy - 31), fill=c, width=7)
    else:
        draw.ellipse((cx - 32, cy - 32, cx + 32, cy + 32), outline=c, width=6)
        draw.line((cx - 32, cy, cx + 32, cy), fill=c, width=5)
        draw.line((cx, cy - 32, cx, cy + 32), fill=c, width=5)
        draw.arc((cx - 20, cy - 32, cx + 20, cy + 32), 90, 270, fill=c, width=5)
        draw.arc((cx - 20, cy - 32, cx + 20, cy + 32), -90, 90, fill=c, width=5)


def draw_row(base, entry, index):
    draw = ImageDraw.Draw(base)
    y = 410 + index * 165
    if index:
        for x in range(64, 960, 16):
            draw.line((x, y - 41, x + 8, y - 41), fill=LINE_BLUE, width=2)
    paste_gradient(base, (69, y + 10, 133, y + 74), 32)
    draw.text((101, y + 43), str(index + 1), anchor="mm", font=font(38, True), fill=(255, 255, 255))
    draw.ellipse((168, y - 11, 274, y + 95), fill=(232, 241, 255))
    kind = "sem" if entry["category"] == "SEM" else ["google", "globe", "growth", "tech", "globe"][min(index, 4)]
    draw_icon(draw, kind, 221, y + 42)

    title_font = font(29, True)
    summary_font = font(23, True)
    title_lines = wrap(draw, entry["title"].replace("：", ": "), title_font, 535, 2)
    summary_lines = wrap(draw, entry["summary"], summary_font, 555, 2)
    for i, line in enumerate(title_lines):
        draw.text((313, y + 3 + i * 37), line, font=title_font, fill=DEEP_BLUE)
    summary_y = y + 13 + len(title_lines) * 37
    for i, line in enumerate(summary_lines):
        draw.text((313, summary_y + i * 30), line, font=summary_font, fill=TEXT_BLUE)
    paste_gradient(base, (886, y + 18, 954, y + 60), 16)
    badge = "实操" if entry["type"] == "practice" else "趋势"
    draw.text((920, y + 40), badge, anchor="mm", font=font(22, True), fill=(255, 255, 255))


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else datetime.now(TIME_ZONE).strftime("%Y-%m-%d")
    logs = json.loads((ROOT / "src/data/logs.json").read_text(encoding="utf-8"))
    daily = sorted(
        [item for item in logs if date_key(item["publishedAt"]) == target],
        key=lambda item: item["publishedAt"],
        reverse=True,
    )
    if not daily:
        raise SystemExit(f"{target} 没有可生成的信息图日志")

    base = Image.new("RGBA", (WIDTH, HEIGHT), (247, 251, 255, 255))
    draw = ImageDraw.Draw(base)

    for x in range(0, WIDTH, 74):
        draw.line((x, 0, x, HEIGHT), fill=(219, 232, 255, 70), width=1)
    for y in range(0, HEIGHT, 74):
        draw.line((0, y, WIDTH, y), fill=(219, 232, 255, 70), width=1)
    draw.pieslice((-170, -220, 1190, 420), 0, 180, fill=(237, 245, 255, 255))
    draw.polygon([(845, 160), (902, 54), (960, 160)], outline=(139, 178, 239, 170), fill=None)
    draw.line((902, 40, 902, 170), fill=(139, 178, 239, 170), width=4)
    draw.arc((820, 125, 982, 190), 10, 170, fill=(157, 191, 242, 170), width=4)

    draw.text((100, 39), "外贸老船长航海日志", font=font(30, True), fill=(111, 145, 202))
    draw.ellipse((25, 31, 61, 67), outline=(114, 149, 207), width=4)
    draw.line((43, 22, 43, 76), fill=(114, 149, 207), width=4)
    draw.line((16, 49, 70, 49), fill=(114, 149, 207), width=4)
    draw.line((24, 30, 62, 68), fill=(114, 149, 207), width=4)
    draw.line((62, 30, 24, 68), fill=(114, 149, 207), width=4)

    paste_gradient(base, (676, 107, 958, 161), 27)
    draw.ellipse((692, 116, 728, 152), outline=(255, 255, 255), width=4)
    draw.line((710, 123, 710, 136, 720, 143), fill=(255, 255, 255), width=4)
    draw.text((739, 120), "近 24 小时精选", font=font(29, True), fill=(255, 255, 255))

    draw.rounded_rectangle((62, 107, 114, 159), 10, fill=(232, 241, 255), outline=BLUE, width=4)
    draw.line((74, 98, 74, 118), fill=BLUE, width=5)
    draw.line((103, 98, 103, 118), fill=BLUE, width=5)
    draw.line((65, 126, 122, 126), fill=BLUE, width=5)
    for x in (76, 90, 104):
        draw.ellipse((x - 4, 137, x + 4, 145), fill=BLUE)
    weekdays = "一二三四五六日"
    date = parse_date(daily[0]["publishedAt"])
    draw.text((142, 113), f"{date:%Y/%m/%d} 周{weekdays[date.weekday()]}", font=font(42, True), fill=DEEP_BLUE)

    draw.text((62, 181), "SEO/SEM", font=font(82, True), fill=BLUE)
    draw.text((556, 181), "每日精选", font=font(82, True), fill=DEEP_BLUE)
    draw.text((255, 298), "外贸独立站 · B2B 营销 · AI 时代增长", font=font(30, True), fill=(45, 58, 85))

    rounded_shadow(base, (40, 344, 984, 1244), 26, (255, 255, 255, 255), (207, 224, 255, 255))
    for index, entry in enumerate(daily[:5]):
        draw_row(base, entry, index)

    draw.rounded_rectangle((62, 1266, 962, 1382), 24, fill=(238, 245, 255), outline=LINE_BLUE, width=2)
    draw.text((96, 1285), "今日判断", font=font(29, True), fill=DEEP_BLUE)
    draw.text((96, 1328), "AI 可见度进入日常复盘，核心更新期先监测，再做结构化修正。", font=font(27, True), fill=TEXT_BLUE)
    news = sum(1 for item in daily if item["type"] == "news")
    practice = sum(1 for item in daily if item["type"] == "practice")
    ai = sum(1 for item in daily if "AI" in " ".join([item["title"], item["summary"], item["mainContent"], *item["tags"]]))
    draw.text((726, 1290), f"资讯 {news} · 实操 {practice} · AI {ai}", font=font(24, True), fill=(49, 92, 153))

    paste_gradient(base, (22, 1456, 1002, 1530), 18)
    draw.ellipse((53, 1470, 99, 1516), fill=(255, 255, 255))
    draw.line((76, 1478, 76, 1506), fill=BLUE, width=4)
    draw.line((62, 1491, 90, 1491), fill=BLUE, width=4)
    draw.arc((61, 1489, 101, 1518), 30, 150, fill=BLUE, width=4)
    draw.text((113, 1480), "关注我，每天 1 分钟，掌握外贸增长新机会！", font=font(24, True), fill=(255, 255, 255))
    draw.text((642, 1480), "点赞　收藏　评论", font=font(24, True), fill=(255, 255, 255))

    out = ROOT / "public/infographics" / f"{target}-seo-sem-daily-summary.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(out, "JPEG", quality=94, optimize=True)
    print(out.relative_to(ROOT))


if __name__ == "__main__":
    main()
