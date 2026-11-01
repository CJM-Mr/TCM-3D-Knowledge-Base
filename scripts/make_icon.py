# -*- coding: utf-8 -*-
"""
把设计稿 PNG 转成 Windows 多尺寸 .ico（用于 exe 图标）
源图是一张 188x142 的稿子，中间是 112x112 的圆角红底「醫」字块。
"""
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'icon-source.png')
OUT_ICO = os.path.join(ROOT, 'assets', 'app.ico')
OUT_PNG = os.path.join(ROOT, 'assets', 'app-256.png')

SIZES = [256, 128, 96, 64, 48, 40, 32, 24, 20, 16]


def find_tile(im):
    """自动定位红色圆角方块（按红色通道占优判定）"""
    w, h = im.size
    px = im.convert('RGB').load()
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r > 42 and r > g * 1.7 and r > b * 1.4:
                xs.append(x)
                ys.append(y)
    if not xs:
        return (0, 0, w, h)
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def rounded_mask(size, radius_ratio=0.215, ss=4):
    """超采样绘制圆角矩形遮罩，边缘平滑"""
    big = size * ss
    m = Image.new('L', (big, big), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * radius_ratio), fill=255)
    return m.resize((size, size), Image.LANCZOS)


def main():
    src = SRC if os.path.isfile(SRC) else sys.argv[1]
    im = Image.open(src).convert('RGBA')
    box = find_tile(im)
    print('源图 %s  裁切 %s' % (im.size, box))

    tile = im.crop(box)
    side = max(tile.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(tile, ((side - tile.width) // 2, (side - tile.height) // 2))

    big = 1024
    base = canvas.resize((big, big), Image.LANCZOS)
    base.putalpha(rounded_mask(big))

    os.makedirs(os.path.dirname(OUT_ICO), exist_ok=True)
    base.resize((256, 256), Image.LANCZOS).save(OUT_PNG)

    frames = [base.resize((s, s), Image.LANCZOS) for s in SIZES]
    frames[0].save(OUT_ICO, format='ICO', sizes=[(s, s) for s in SIZES])
    print('生成 %s（%.1f KB，%d 个尺寸）' % (OUT_ICO, os.path.getsize(OUT_ICO) / 1024, len(SIZES)))
    print('预览 %s' % OUT_PNG)


if __name__ == '__main__':
    main()
