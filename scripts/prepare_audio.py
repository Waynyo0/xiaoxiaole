import os
import subprocess

SRC = r"C:\Users\WAYNY\Pictures\消消乐素材"
DST = r"E:\xiaoxiaole\public\assets"


def run(args):
    print("RUN", " ".join(args[:4]), "...")
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print("ERR", r.stderr[-300:])


def to_mp3(src_rel, dst_rel):
    src = os.path.join(SRC, src_rel)
    dst = os.path.join(DST, dst_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    run(["ffmpeg", "-y", "-i", src, "-codec:a", "libmp3lame", "-b:a", "128k", dst])


def main():
    to_mp3(r"音效\开始界面+选择关卡bgm.wav", r"audio\bgm_menu.mp3")
    for i in range(1, 6):
        to_mp3(f"关卡{i}bgm.mp3", f"audio\\bgm_level_{i}.mp3")
    to_mp3(r"音效\开始游戏+选择关卡音效.wav", r"audio\sfx_ui_click.mp3")
    to_mp3(r"音效\退出游戏.wav", r"audio\sfx_quit.mp3")
    to_mp3(r"音效\划动音效.wav", r"audio\sfx_swap.mp3")
    to_mp3(r"音效\开场报幕.wav", r"audio\sfx_opening.mp3")

    # OP 视频 + 海报
    src_video = os.path.join(SRC, "千恋＊万花OP动画.mp4")
    dst_video = os.path.join(DST, "video", "op_web.mp4")
    dst_poster = os.path.join(DST, "video", "op_poster.jpg")
    os.makedirs(os.path.dirname(dst_video), exist_ok=True)
    run(["ffmpeg", "-y", "-i", src_video, "-vf", "scale=1280:720", "-c:v", "libx264", "-crf", "25", "-preset", "medium", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", dst_video])
    run(["ffmpeg", "-y", "-ss", "00:00:05", "-i", src_video, "-frames:v", "1", "-q:v", "3", dst_poster])

    print("DONE")


if __name__ == "__main__":
    main()
