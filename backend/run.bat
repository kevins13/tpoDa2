call npx prisma generate
call npx prisma db push --accept-data-loss
call psql -U Flor -d "HammerSubastas" -f ../paises.sql
call npx prisma db seed
