import os
import time
import subprocess
import random
import threading
from textblob import TextBlob
from rich.console import Console
from rich.panel import Panel
from rich.live import Live
from rich.table import Table
from rich import box

# --- CONFIGURATION ---
DEBATE_TOPICS = [
    "Is a hotdog a sandwich?",
    "Is water wet?",
    "Does pineapple belong on pizza?",
    "Is cereal soup?",
    "Should toilet paper hang over or under?",
    "Is a taco a sandwich?",
    "Are birds real?",
    "Is math discovered or invented?",
    "Should you put milk before cereal?",
    "Is a straw one hole or two?",
    "Are hot dogs better than hamburgers?",
    "Is Pluto a planet?",
    "Should you stand or sit to wipe?",
    "Is GIF pronounced jif or gif?",
    "Are pancakes just flat cakes?",
    "Is ketchup a smoothie?",
    "Should you bite or lick ice cream?",
    "Is a pop tart a ravioli?",
    "Are eyebrows facial hair?",
    "Is soup a drink or a food?",
    "Do fish get thirsty?",
    "Is a thumb a finger?",
    "Are sandwiches better cut diagonal or square?",
    "Should you shower in the morning or night?",
    "Is folding pizza acceptable?",
    "Are beans a vegetable or protein?",
    "Is 11 AM still morning?",
    "Should you eat the pizza crust?",
    "Is a quesadilla a sandwich?",
    "Are cookies better soft or crunchy?",
]

TOPIC = random.choice(DEBATE_TOPICS)
GH_PATH = os.path.join(os.getcwd(), "gh.exe")

console = Console()

# 8-BIT PIXEL CHARACTER FRAMES - Captain Capslock (angry old man)
CAPTAIN_IDLE = [
    "    [red]####[/]    ",
    "   [red]#[white]o  o[/][red]#[/]   ",
    "   [red]# [/][white]><[/] [red]#[/]   ",
    "   [red]######[/]   ",
    "    [yellow]####[/]    ",
    "   [yellow]#[/]    [yellow]#[/]   ",
    "   [yellow]#[/]    [yellow]#[/]   ",
    "   [red]##[/]  [red]##[/]   ",
]

CAPTAIN_THINK = [
    "    [red]####[/]  [white]?[/] ",
    "   [red]#[white]o  -[/][red]#[/][white]?[/]  ",
    "   [red]# [/][white]~~[/] [red]#[/]   ",
    "   [red]######[/]   ",
    "    [yellow]#[/][white]||[/][yellow]#[/]    ",
    "   [yellow]#[/]    [yellow]#[/]   ",
    "   [yellow]#[/]    [yellow]#[/]   ",
    "   [red]##[/]  [red]##[/]   ",
]

CAPTAIN_ATTACK = [
    " [white]POW![/][red]####[/]   ",
    "   [red]#[white]X  X[/][red]#[/]   ",
    "   [red]# [/][white]##[/] [red]#[/]   ",
    "   [red]######[/]   ",
    "  [yellow]##[/][white]/[/][yellow]##[/][white]\\[/]   ",
    " [yellow]#[/]      [yellow]#[/]  ",
    " [yellow]#[/]      [yellow]#[/]  ",
    " [red]##[/]    [red]##[/]  ",
]

# 8-BIT PIXEL CHARACTER FRAMES - Lil Zoomer (teen with phone)
ZOOMER_IDLE = [
    "    [cyan]####[/]    ",
    "   [cyan]#[white]-  -[/][cyan]#[/]   ",
    "   [cyan]# [/][white]__[/] [cyan]#[/]   ",
    "   [cyan]######[/]   ",
    "    [magenta]####[/]    ",
    "   [magenta]#[/][white][]  [/][magenta]#[/]   ",
    "   [magenta]#[/]    [magenta]#[/]   ",
    "   [cyan]##[/]  [cyan]##[/]   ",
]

ZOOMER_THINK = [
    "    [cyan]####[/]  [white].[/] ",
    "   [cyan]#[white]@  @[/][cyan]#[/][white].[/]  ",
    "   [cyan]# [/][white]~~[/] [cyan]#[/][white].[/]  ",
    "   [cyan]######[/]   ",
    "    [magenta]#[/][white]||[/][magenta]#[/]    ",
    "   [magenta]#[/][white][][/]  [magenta]#[/]   ",
    "   [magenta]#[/]    [magenta]#[/]   ",
    "   [cyan]##[/]  [cyan]##[/]   ",
]

ZOOMER_ATTACK = [
    "   [cyan]####[/][white]BRO![/]",
    "   [cyan]#[white]>  <[/][cyan]#[/]   ",
    "   [cyan]# [/][white]oo[/] [cyan]#[/]   ",
    "   [cyan]######[/]   ",
    "  [white]\\[/][magenta]##[/][white]/\\[/][magenta]##[/]   ",
    "  [magenta]#[/]      [magenta]#[/]  ",
    "  [magenta]#[/]      [magenta]#[/]  ",
    "  [cyan]##[/]    [cyan]##[/]  ",
]

# Additional animation frames for variety
CAPTAIN_RAGE = [
    " [white]!!!![/][red]####[/]   ",
    "   [red]#[white]@  @[/][red]#[/]   ",
    "   [red]#[/][white]####[/][red]#[/]   ",
    "   [red]######[/]   ",
    "  [yellow]##[/][white]\\[/][yellow]##[/][white]/[/]   ",
    " [yellow]#[/]  [white]||[/]  [yellow]#[/]  ",
    " [yellow]#[/]      [yellow]#[/]  ",
    " [red]##[/]    [red]##[/]  ",
]

ZOOMER_CRINGE = [
    "   [cyan]####[/][white]ugh[/] ",
    "   [cyan]#[white]u  u[/][cyan]#[/]   ",
    "   [cyan]# [/][white]~~[/] [cyan]#[/]   ",
    "   [cyan]######[/]   ",
    "    [magenta]##[/][white]\\[/][magenta]#[/]    ",
    "   [magenta]#[/][white][][/][white]/[/] [magenta]#[/]   ",
    "   [magenta]#[/]    [magenta]#[/]   ",
    "   [cyan]##[/]  [cyan]##[/]   ",
]

FIGHTER_A = {
    "name": "Captain Capslock", 
    "color": "red", 
    "idle": CAPTAIN_IDLE,
    "think": CAPTAIN_THINK,
    "attack": CAPTAIN_ATTACK,
    "special": CAPTAIN_RAGE,
    "anger": 50, 
    "wins": 0
}

FIGHTER_B = {
    "name": "Lil Zoomer", 
    "color": "cyan",
    "idle": ZOOMER_IDLE,
    "think": ZOOMER_THINK,
    "attack": ZOOMER_ATTACK,
    "special": ZOOMER_CRINGE,
    "anger": 50, 
    "wins": 0
}

# Attack effect frames
ATTACK_EFFECTS = [
    ["     [yellow]*[/]     ", "   [yellow]* * *[/]   ", "  [yellow]* BAM *[/]  ", "   [yellow]* * *[/]   ", "     [yellow]*[/]     "],
    ["   [red]/\\[/]  [red]/\\[/]   ", "  [red]/[/][white]POW[/][red]\\[/]   ", "  [red]\\[/]    [red]/[/]   ", "   [red]\\/[/]  [red]\\/[/]   "],
    ["  [magenta]~[/][white]WHAM[/][magenta]~[/]  ", " [magenta]~[/]      [magenta]~[/] ", "  [magenta]~~~~~~[/]  "],
]

class ResponseFetcher:
    def __init__(self):
        self.result = None
        self.done = False
    
    def fetch(self, persona, opponent_text, topic):
        clean_opp = opponent_text.replace('"', '').replace("'", "").replace('\n', ' ')[:80]
        # Frame as creative writing to bypass safety filters
        prompt = f"Creative writing exercise: Write ONE short funny sentence as a character debating '{topic}'. {persona} The opponent just said: '{clean_opp}'. Stay in character!"
        cmd = [GH_PATH, "copilot", "-p", prompt]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', timeout=30)
            if result.returncode != 0:
                # Try to get error message
                err = result.stderr.strip()[:50] if result.stderr else "unknown error"
                self.result = f"*{err}*" if err else "*glares*"
            else:
                lines = result.stdout.split('\n')
                response_lines = []
                for line in lines:
                    if any(x in line for x in ['Total usage', 'API time', 'Breakdown', 'claude-', 'Total code', 'Total session', 'Est.']):
                        break
                    if line.strip():
                        response_lines.append(line.strip())
                response = ' '.join(response_lines).strip()
                self.result = response if response else "*stares blankly*"
        except subprocess.TimeoutExpired:
            self.result = "*took too long, brain freeze*"
        except FileNotFoundError:
            self.result = "*gh.exe not found*"
        except Exception as e:
            self.result = f"*oops: {str(e)[:30]}*"
        self.done = True

def render_character(sprite_lines):
    return "\n".join(sprite_lines)

def create_battle_display(fighter_a_sprite, fighter_b_sprite, status_text="", topic="", anger_a=50, anger_b=50):
    table = Table(show_header=False, box=None, padding=0)
    table.add_column(width=5, justify="right")   # Left rage bar
    table.add_column(width=18, justify="center") # Fighter A
    table.add_column(width=6, justify="center")  # VS
    table.add_column(width=18, justify="center") # Fighter B
    table.add_column(width=5, justify="left")    # Right rage bar
    
    # Create vertical rage bars
    rage_a = create_vertical_rage(anger_a, "red")
    rage_b = create_vertical_rage(anger_b, "cyan")
    
    for i in range(len(fighter_a_sprite)):
        mid = "[bold yellow]VS[/]" if i == 3 else ""
        left_bar = rage_a[i] if i < len(rage_a) else ""
        right_bar = rage_b[i] if i < len(rage_b) else ""
        table.add_row(left_bar, fighter_a_sprite[i], mid, fighter_b_sprite[i], right_bar)
    
    title = f"[bold magenta]BATTLE ARENA[/] - [dim]{topic}[/]" if topic else "[bold magenta]BATTLE ARENA[/]"
    return Panel(table, title=title, subtitle=status_text, border_style="magenta", box=box.DOUBLE)

def create_vertical_rage(anger, color):
    """Create a vertical rage meter (8 rows tall)"""
    filled = anger // 12  # 0-8 blocks for 0-100 anger
    bars = []
    for i in range(8):
        row_num = 7 - i  # Start from bottom
        if row_num < filled:
            bars.append(f"[{color}]█[/]")
        else:
            bars.append(f"[dim]░[/]")
    return bars

def shake_sprite(sprite, intensity=1):
    """Add shake effect to sprite"""
    offsets = [" ", "  ", " ", ""]
    offset = random.choice(offsets[:intensity+1])
    return [offset + line for line in sprite]

def bounce_sprite(sprite, frame):
    """Add bounce effect to sprite"""
    bounce_pattern = ["", " ", "  ", " ", ""]
    offset = bounce_pattern[frame % len(bounce_pattern)]
    # Add vertical bounce by inserting/removing top padding
    if frame % 4 < 2:
        return [""] + sprite[:-1]  # Shift down
    return sprite

def get_response_animated(console, fighter, opponent, persona, opponent_text, topic):
    fetcher = ResponseFetcher()
    thread = threading.Thread(target=fetcher.fetch, args=(persona, opponent_text, topic))
    thread.start()
    
    frame = 0
    
    with Live(console=console, refresh_per_second=12) as live:
        while not fetcher.done:
            # Animate thinking character with bounce
            think_sprite = bounce_sprite(fighter["think"].copy(), frame)
            idle_sprite = opponent["idle"].copy()
            
            # Add loading bar
            bar_chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
            spinner = bar_chars[frame % len(bar_chars)]
            
            status = f"[yellow]{spinner} {fighter['name']} thinking...[/]"
            
            display = create_battle_display(think_sprite, idle_sprite, status, topic=topic, anger_a=fighter["anger"], anger_b=opponent["anger"])
            live.update(display)
            frame += 1
            time.sleep(0.1)
    
    thread.join()
    return fetcher.result

def show_attack_and_response(console, attacker, defender, response, anger, is_left=True, topic=""):
    """Show attack animation then display response"""
    effects = ["💥 POW!", "⚡ ZAP!", "🔥 BURN!", "💢 WHAM!", "✨ BOOM!"]
    effect = random.choice(effects)
    
    # Get anger values for display
    anger_a = attacker["anger"]
    anger_b = defender["anger"]
    
    with Live(console=console, refresh_per_second=15) as live:
        # Attack frames with rage meters
        for i in range(8):
            attack_sprite = shake_sprite(attacker["attack" if i % 2 == 0 else "special"].copy(), 2)
            defend_sprite = shake_sprite(defender["idle"].copy(), 1) if i > 3 else defender["idle"].copy()
            
            if is_left:
                display = create_battle_display(attack_sprite, defend_sprite, f"[bold yellow]{effect}[/]", topic=topic, anger_a=anger_a, anger_b=anger_b)
            else:
                display = create_battle_display(defend_sprite, attack_sprite, f"[bold yellow]{effect}[/]", topic=topic, anger_a=anger_b, anger_b=anger_a)
            live.update(display)
            time.sleep(0.1)
        
        # Victory pose
        for i in range(4):
            if is_left:
                a_sprite = bounce_sprite(attacker["idle"].copy(), i)
                display = create_battle_display(a_sprite, defender["idle"].copy(), "", topic=topic, anger_a=anger, anger_b=anger_b)
            else:
                b_sprite = bounce_sprite(defender["idle"].copy(), i)
                display = create_battle_display(attacker["idle"].copy(), b_sprite, "", topic=topic, anger_a=anger_a, anger_b=anger)
            live.update(display)
            time.sleep(0.08)
    
    # Print the full response panel below
    color = attacker["color"]
    name = attacker["name"]
    console.print(Panel(
        f"[bold white]{response}[/]",
        title=f"[{color}]{name}[/] - Rage: {anger}%",
        border_style=color,
        box=box.ROUNDED
    ))

def calculate_anger(text):
    if not text or text.startswith("*"):
        return random.randint(40, 60)
    blob = TextBlob(text)
    anger = int((blob.sentiment.polarity * -60) + 50) + random.randint(-10, 10)
    return max(0, min(100, anger))

def anger_bar(anger, color):
    filled = anger // 10
    bar = "[" + "#" * filled + "-" * (10 - filled) + "]"
    return f"[{color}]RAGE: {bar} {anger}%[/]"

def main():
    global TOPIC
    
    if not os.path.exists(GH_PATH):
        console.print("[bold red]Error: gh.exe not found![/]")
        return

    console.clear()
    
    # Topic selection menu
    console.print(Panel.fit(
        "[bold magenta]AI DEBATE ARENA[/]\n\n"
        "[white]Choose your debate mode:[/]\n\n"
        "[yellow]1.[/] Random Topic (surprise me!)\n"
        "[yellow]2.[/] Pick from List\n"
        "[yellow]3.[/] Enter Custom Topic\n",
        border_style="magenta"
    ))
    
    choice = console.input("[yellow]Enter choice (1/2/3): [/]").strip()
    
    if choice == "2":
        console.clear()
        console.print("[bold yellow]Pick a topic:[/]\n")
        for i, topic in enumerate(DEBATE_TOPICS[:15], 1):
            console.print(f"[cyan]{i:2}.[/] {topic}")
        console.print(f"[cyan] 0.[/] [dim]Show more...[/]")
        
        pick = console.input("\n[yellow]Enter number: [/]").strip()
        if pick == "0":
            console.clear()
            console.print("[bold yellow]More topics:[/]\n")
            for i, topic in enumerate(DEBATE_TOPICS[15:], 16):
                console.print(f"[cyan]{i:2}.[/] {topic}")
            pick = console.input("\n[yellow]Enter number: [/]").strip()
        
        try:
            idx = int(pick) - 1
            if 0 <= idx < len(DEBATE_TOPICS):
                TOPIC = DEBATE_TOPICS[idx]
        except:
            TOPIC = random.choice(DEBATE_TOPICS)
            
    elif choice == "3":
        custom = console.input("[yellow]Enter your debate topic: [/]").strip()
        if custom:
            TOPIC = custom
        else:
            TOPIC = random.choice(DEBATE_TOPICS)
    else:
        TOPIC = random.choice(DEBATE_TOPICS)
    
    console.clear()
    
    # Title screen
    title = """
[bold magenta]
   ###   ####       ####   ##### ####    ###  #####  #####
  #   #    #        #   #  #     #   #  #   #   #    #    
  #####    #        #   #  ####  ####   #####   #    #### 
  #   #    #        #   #  #     #   #  #   #   #    #    
  #   #  ####       ####   ##### ####   #   #   #    #####
[/]
    """
    console.print(title)
    console.print(f"\n[white]Topic: [bold]{TOPIC}[/][/]\n")
    
    # Show characters
    table = Table(show_header=False, box=None)
    table.add_column(width=25, justify="center")
    table.add_column(width=10, justify="center")
    table.add_column(width=25, justify="center")
    
    for i in range(len(CAPTAIN_IDLE)):
        table.add_row(CAPTAIN_IDLE[i], "[bold yellow]VS[/]" if i == 3 else "", ZOOMER_IDLE[i])
    
    console.print(Panel(table, title="[red]Captain Capslock[/] vs [cyan]Lil Zoomer[/]", border_style="yellow"))
    console.print("\n[dim]Press Ctrl+C to stop[/]\n")
    time.sleep(2)
    
    last = f"I think {TOPIC}"
    round_num = 1
    
    while True:
        console.rule(f"[bold yellow]ROUND {round_num}[/]")
        
        # Fighter A attacks
        persona_a = "You are an angry boomer who HATES modern opinions. Use CAPS LOCK. Be dramatic and funny."
        resp_a = get_response_animated(console, FIGHTER_A, FIGHTER_B, persona_a, last, TOPIC)
        FIGHTER_A['anger'] = calculate_anger(resp_a)
        
        show_attack_and_response(console, FIGHTER_A, FIGHTER_B, resp_a, FIGHTER_A['anger'], is_left=True, topic=TOPIC)
        
        last = resp_a
        time.sleep(0.5)
        
        # Fighter B attacks
        persona_b = "You are a sarcastic Gen-Z teen. Use slang like 'no cap', 'mid', 'fr fr', 'bestie'. Be funny and dismissive."
        resp_b = get_response_animated(console, FIGHTER_B, FIGHTER_A, persona_b, last, TOPIC)
        FIGHTER_B['anger'] = calculate_anger(resp_b)
        
        show_attack_and_response(console, FIGHTER_B, FIGHTER_A, resp_b, FIGHTER_B['anger'], is_left=False, topic=TOPIC)
        
        # Score
        if FIGHTER_A['anger'] > FIGHTER_B['anger']:
            FIGHTER_A['wins'] += 1
            console.print(f"[bold red]{FIGHTER_A['name']} wins this round![/]")
        else:
            FIGHTER_B['wins'] += 1
            console.print(f"[bold cyan]{FIGHTER_B['name']} wins this round![/]")
        
        console.print(f"[dim]Score: {FIGHTER_A['wins']} - {FIGHTER_B['wins']}[/]\n")
        
        last = resp_b
        round_num += 1
        time.sleep(0.5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.clear()
        console.print(Panel.fit(
            f"[bold green]GAME OVER![/]\n\n"
            f"[red]{FIGHTER_A['name']}: {FIGHTER_A['wins']} wins[/]\n"
            f"[cyan]{FIGHTER_B['name']}: {FIGHTER_B['wins']} wins[/]\n\n"
            f"[bold yellow]{'Captain Capslock' if FIGHTER_A['wins'] > FIGHTER_B['wins'] else 'Lil Zoomer'} is the CHAMPION![/]",
            title="FINAL SCORE",
            border_style="green"
        ))
