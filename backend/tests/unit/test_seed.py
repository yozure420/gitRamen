import seed

COMMAND_GROUPS = [seed.beginner_commands, seed.intermediate_commands, seed.advanced_commands, seed.expert_commands]


def test_format_command_joins_option():
    assert seed.format_command("git status", "—") == "git status"
    assert seed.format_command("git add", ".") == "git add ."


def test_every_course_has_playable_commands():
    for course in range(1, 5):
        assert seed.PLAYABLE_COMMANDS.get(course), f"course {course} has no playable commands"


def test_playable_commands_exist_in_seed_rows():
    """PLAYABLE_COMMANDS の表記ゆれで、実装済みコマンドが playable=False になるのを防ぐ"""
    for course, rows in enumerate(COMMAND_GROUPS, start=1):
        seeded = {seed.format_command(row[0], row[1]) for row in rows}
        missing = seed.PLAYABLE_COMMANDS.get(course, set()) - seeded
        assert not missing, f"course {course}: {missing}"


def test_playable_commands_have_game_note():
    for course, rows in enumerate(COMMAND_GROUPS, start=1):
        for row in rows:
            command = seed.format_command(row[0], row[1])
            if command in seed.PLAYABLE_COMMANDS.get(course, set()):
                assert len(row) == 4 and row[3], f"{command} needs game_note for help UI"


def test_start_screen_commands_are_not_playable_in_game():
    assert "git init" not in seed.PLAYABLE_COMMANDS[1]
    assert "git clone <URL>" not in seed.PLAYABLE_COMMANDS[1]


def test_bisect_bad_help_matches_what_the_game_accepts():
    """ゲームが受け付けるのは引数なし（または HEAD）の git bisect bad だけなので、ヘルプにハッシュ付きで出さない"""
    assert "git bisect bad" in seed.PLAYABLE_COMMANDS[3]
    assert "git bisect bad <hash>" not in seed.PLAYABLE_COMMANDS[3]
