import os
import sys
from PIL import Image

try:
    import numpy as np
    from scipy import ndimage
    HAS_SCIPY = True
except Exception:
    HAS_SCIPY = False

SRC = r"C:\Users\WAYNY\Pictures\消消乐素材"
DST = r"E:\xiaoxiaole\public\assets"


def makedirs(*parts):
    d = os.path.join(DST, *parts)
    os.makedirs(d, exist_ok=True)
    return d


def copy(name, src_rel, dst_rel):
    src = os.path.join(SRC, src_rel)
    dst = os.path.join(DST, dst_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(src):
        print("MISSING", src)
        return
    Image.open(src).convert("RGBA").save(dst)
    print("copy", dst_rel)


def crop_bbox_save(src_rel, dst_rel, pad_square=False, max_side=None):
    src = os.path.join(SRC, src_rel)
    dst = os.path.join(DST, dst_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(src):
        print("MISSING", src)
        return
    im = Image.open(src).convert("RGBA")
    bbox = im.getbbox()
    if not bbox:
        print("EMPTY", src_rel)
        return
    im = im.crop(bbox)
    if pad_square:
        w, h = im.size
        s = max(w, h)
        canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        canvas.paste(im, ((s - w) // 2, (s - h) // 2), im)
        im = canvas
    if max_side and max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dst)
    print("crop", dst_rel, im.size)


def make_frame_overlay(src_rel, dst_rel, inset=40):
    src = os.path.join(SRC, src_rel)
    dst = os.path.join(DST, dst_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    for y in range(inset, h - inset):
        for x in range(inset, w - inset):
            r, g, b, a = px[x, y]
            if a > 0 and r >= 242 and g >= 242 and b >= 242:
                px[x, y] = (r, g, b, 0)
    im.save(dst)
    print("frame", dst_rel, im.size)


def crop_solid(src_rel, dst_rel, threshold=200, min_count=10):
    src = os.path.join(SRC, src_rel)
    dst = os.path.join(DST, dst_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    a = im.getchannel("A")
    rows = []
    for y in range(h):
        cnt = 0
        for x in range(w):
            if a.getpixel((x, y)) > threshold:
                cnt += 1
                if cnt > min_count:
                    break
        if cnt > min_count:
            rows.append(y)
    cols = []
    for x in range(w):
        cnt = 0
        for y in range(h):
            if a.getpixel((x, y)) > threshold:
                cnt += 1
                if cnt > min_count:
                    break
        if cnt > min_count:
            cols.append(x)
    if not rows or not cols:
        print("EMPTY", src_rel)
        return
    bbox = (min(cols), min(rows), max(cols) + 1, max(rows) + 1)
    im.crop(bbox).save(dst)
    print("solid", dst_rel, bbox)


def crop_rect(src_rel, dst_rel, box):
    src = os.path.join(SRC, src_rel)
    dst = os.path.join(DST, dst_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    Image.open(src).convert("RGBA").crop(box).save(dst)
    print("rect", dst_rel, box)


def crop_digit(src_rel, dst_rel, margin_ratio=0.10):
    src = os.path.join(SRC, src_rel)
    dst = os.path.join(DST, dst_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src).convert("RGBA")
    a = im.getchannel("A")
    solid = None
    if HAS_SCIPY:
        arr = np.array(a)
        mask = arr > 200
        labels, n = ndimage.label(mask)
        if n > 0:
            sizes = ndimage.sum(mask, labels, range(1, n + 1))
            idx = int(np.argmax(sizes)) + 1
            ys, xs = np.where(labels == idx)
            solid = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    if solid is None:
        solid = a.point(lambda v: 255 if v > 200 else 0).getbbox()
    if not solid:
        print("EMPTY", src_rel)
        return
    x0, y0, x1, y1 = solid
    w, h = x1 - x0, y1 - y0
    m = int(max(4, max(w, h) * margin_ratio))
    box = (max(0, x0 - m), max(0, y0 - m), min(im.width, x1 + m), min(im.height, y1 + m))
    im.crop(box).save(dst)
    print("digit", dst_rel, box)


def crop_piece(src_rel, dst_rel, threshold=64, max_side=512):
    src = os.path.join(SRC, src_rel)
    dst = os.path.join(DST, dst_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src).convert("RGBA")
    a = im.getchannel("A")
    bbox = a.point(lambda v: 255 if v > threshold else 0).getbbox()
    if not bbox:
        print("EMPTY", src_rel)
        return
    im = im.crop(bbox)
    if max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dst)
    print("piece", dst_rel, im.size)


def main():
    # 背景
    copy("首页背景", "封面素材\\首页背景.png", "bg\\bg_menu.png")
    copy("背景1", "关卡选择素材\\背景1.png", "bg\\bg_levels_character.png")
    make_frame_overlay("关卡选择素材\\背景2.png", "bg\\bg_levels_frame.png")
    copy("背景3", "关卡选择素材\\背景3.png", "bg\\bg_levels_petals.png")
    copy("关卡背景", "游戏页面素材\\关卡背景.png", "bg\\bg_game.png")

    # 封面 UI
    copy("标题", "封面素材\\标题.png", "ui\\logo.png")
    copy("开始按钮", "封面素材\\开始游戏按钮.png", "ui\\btn_start.png")
    copy("退出按钮", "封面素材\\退出游戏按钮.png", "ui\\btn_quit.png")
    copy("18+提示", "封面素材\\18+提示.png", "ui\\icon_18plus.png")
    copy("返回按钮", "关卡选择素材\\返回按钮.png", "ui\\btn_back.png")
    crop_rect("关卡选择素材\\选择关卡按钮.png", "ui\\level_title.png", (0, 0, 251, 77))
    for i in range(1, 6):
        copy(f"关卡{i}按钮", f"关卡选择素材\\大作业选择关卡_{i}.png", f"ui\\level_{i}.png")
    copy("锁", "关卡选择素材\\锁图标.png", "ui\\icon_lock.png")
    copy("齿轮", "游戏页面素材\\齿轮.png", "ui\\icon_gear.png")
    copy("加号", "游戏页面素材\\加号.png", "ui\\icon_plus.png")
    copy("分数牌", "游戏页面素材\\分数牌.png", "ui\\score_placard.png")
    copy("步数牌", "游戏页面素材\\步数牌.png", "ui\\moves_placard.png")
    copy("助手", "游戏页面素材\\助手芳乃.png", "ui\\assistant.png")
    copy("火箭", "游戏页面素材\\箭头.png", "ui\\prop_rocket.png")
    copy("时钟", "游戏页面素材\\钟.png", "ui\\prop_clock.png")
    copy("炸弹", "游戏页面素材\\炸弹.png", "ui\\prop_bomb.png")
    copy("五角星", "游戏页面素材\\五角星.png", "ui\\star_filled.png")
    copy("五角星空心", "游戏页面素材\\五角星空心.png", "ui\\star_empty.png")

    # 数字：按实心字形裁切并留 10% 边距，统一视觉大小
    for d in range(10):
        crop_digit(f"数字\\{d}.png", f"digits\\digit_{d}.png")

    # 棋子（从雨裁边补方形）
    pieces = ["玉佩", "狐狸面具", "铃铛", "扇子", "芳乃", "从雨"]
    for i, name in enumerate(pieces):
        crop_piece(f"游戏页面素材\\{name}.png", f"pieces\\piece_{i}.png")

    print("DONE")


if __name__ == "__main__":
    main()
