import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "data" / "handout-content.json"
OUTPUT_PATH = ROOT / "output" / "pdf" / "五年级数学知识点精华讲义.pdf"

PAPER = HexColor("#fffaf1")
PLUM = HexColor("#35253a")
INK = HexColor("#211d20")
MUTED = HexColor("#6c625f")
GOLD = HexColor("#c9952e")
GOLD_PALE = HexColor("#f6e6b8")
CORAL_PALE = HexColor("#f8d9d2")
GREEN_PALE = HexColor("#dce9e2")
LINE = HexColor("#d9ccba")
WHITE = HexColor("#fffefd")


def register_fonts():
    pdfmetrics.registerFont(TTFont("MSYH", r"C:\Windows\Fonts\msyh.ttc", subfontIndex=0))
    pdfmetrics.registerFont(TTFont("MSYH-Bold", r"C:\Windows\Fonts\msyhbd.ttc", subfontIndex=0))
    pdfmetrics.registerFont(TTFont("Kaiti", r"C:\Windows\Fonts\simkai.ttf"))


def paragraph(text, style, width, height):
    item = Paragraph(escape(text), style)
    item.wrapOn(None, width, height)
    return item


def draw_row(pdf, x, y_top, width, label, text, style, label_fill):
    label_w = 13 * mm
    content_x = x + label_w + 3 * mm
    content_w = width - label_w - 3 * mm
    para = Paragraph(escape(text), style)
    _, para_h = para.wrap(content_w, 22 * mm)
    row_h = max(6.3 * mm, para_h + 1.2 * mm)
    pdf.setFillColor(label_fill)
    pdf.roundRect(x, y_top - 5.4 * mm, label_w, 5.4 * mm, 1.2 * mm, fill=1, stroke=0)
    pdf.setFillColor(PLUM if label != "易错" else HexColor("#8d3327"))
    pdf.setFont("MSYH-Bold", 8)
    pdf.drawCentredString(x + label_w / 2, y_top - 3.75 * mm, label)
    para.drawOn(pdf, content_x, y_top - para_h - 0.4 * mm)
    return y_top - row_h


def draw_card(pdf, chapter, x, y_top, width, height):
    y = y_top - height
    pdf.setFillColor(WHITE)
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.6)
    pdf.roundRect(x, y, width, height, 2.2 * mm, fill=1, stroke=1)
    pdf.setFillColor(PLUM)
    pdf.rect(x, y, 2.5 * mm, height, fill=1, stroke=0)

    circle_x = x + 10 * mm
    circle_y = y_top - 10 * mm
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.7)
    pdf.circle(circle_x, circle_y, 5.1 * mm, fill=0, stroke=1)
    pdf.setFillColor(GOLD)
    pdf.setFont("MSYH-Bold", 9)
    pdf.drawCentredString(circle_x, circle_y - 1.3 * mm, chapter["number"])

    title_x = x + 19 * mm
    pdf.setFillColor(PLUM)
    pdf.setFont("Kaiti", 16)
    pdf.drawString(title_x, y_top - 8.1 * mm, chapter["officialName"])
    pdf.setFillColor(GOLD)
    pdf.setFont("MSYH-Bold", 7.5)
    pdf.drawString(title_x, y_top - 12.7 * mm, "案卷主题 · " + chapter["caseName"])

    body_style = ParagraphStyle(
        "body",
        fontName="MSYH",
        fontSize=8.4,
        leading=11.8,
        textColor=INK,
        alignment=TA_LEFT,
        wordWrap="CJK",
    )
    cursor = y_top - 19 * mm
    content_x = x + 6 * mm
    content_w = width - 11 * mm
    cursor = draw_row(pdf, content_x, cursor, content_w, "核心", chapter["core"], body_style, GOLD_PALE)
    methods = "① " + chapter["methods"][0] + "  ② " + chapter["methods"][1]
    cursor = draw_row(pdf, content_x, cursor, content_w, "方法", methods, body_style, GOLD_PALE)
    cursor = draw_row(pdf, content_x, cursor, content_w, "易错", chapter["mistake"], body_style, CORAL_PALE)
    draw_row(pdf, content_x, cursor, content_w, "例", chapter["example"], body_style, GREEN_PALE)


def draw_page(pdf, data, chapters, page_index):
    width, height = A4
    pdf.setFillColor(PAPER)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(PLUM)
    pdf.rect(0, 0, 5 * mm, height, fill=1, stroke=0)

    left = 16 * mm
    right = width - 15 * mm
    top = height - 14 * mm
    pdf.setFillColor(GOLD)
    pdf.setFont("MSYH-Bold", 7.5)
    pdf.drawString(left, top, "数学解谜局 · KNOWLEDGE FILE")
    pdf.setFillColor(PLUM)
    pdf.setFont("Kaiti", 22)
    pdf.drawString(left, top - 8.2 * mm, data["title"])
    pdf.setFillColor(MUTED)
    pdf.setFont("MSYH", 8.5)
    pdf.drawString(left, top - 13.4 * mm, data["subtitle"])

    page_text = f"{page_index:02d} / 03"
    pdf.setStrokeColor(LINE)
    pdf.roundRect(right - 22 * mm, top - 8 * mm, 22 * mm, 9 * mm, 1.2 * mm, fill=0, stroke=1)
    pdf.setFillColor(PLUM)
    pdf.setFont("MSYH-Bold", 8)
    pdf.drawCentredString(right - 11 * mm, top - 4.8 * mm, page_text)
    pdf.setStrokeColor(GOLD)
    pdf.line(left, top - 18 * mm, right, top - 18 * mm)

    card_top = top - 24 * mm
    card_height = 72 * mm
    card_gap = 4.5 * mm
    card_width = right - left
    for index, chapter in enumerate(chapters):
        draw_card(pdf, chapter, left, card_top - index * (card_height + card_gap), card_width, card_height)

    footer_y = 7 * mm
    pdf.setStrokeColor(LINE)
    pdf.line(left, footer_y + 4 * mm, right, footer_y + 4 * mm)
    pdf.setFillColor(MUTED)
    pdf.setFont("MSYH", 7)
    pdf.drawString(left, footer_y, "先说方法，再做一步验证。")
    pdf.drawRightString(right, footer_y, "五年级数学 · 知识点精华")


def main():
    register_fonts()
    data = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    chapters = data["chapters"]
    if len(chapters) != 9:
        raise ValueError("讲义必须恰好包含九个单元")
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT_PATH), pagesize=A4, pageCompression=1)
    pdf.setTitle(data["title"])
    pdf.setAuthor("数学解谜局")
    for page_index in range(1, 4):
        draw_page(pdf, data, chapters[(page_index - 1) * 3:page_index * 3], page_index)
        pdf.showPage()
    pdf.save()
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
