#!/bin/sh
set -e
# ボリュームマウント後にdbディレクトリの所有者をmyuserに修正
chown -R myuser:myuser /app/db
exec gosu myuser "$@"
