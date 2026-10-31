#!/bin/bash
export DATABASE_URL=postgresql://lhbd:lhbd_secret@127.0.0.1:5432/lhbd
export NODE_ENV=production
exec npx next start -H 0.0.0.0 -p 3000
