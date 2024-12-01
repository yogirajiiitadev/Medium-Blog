import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge';
// import { PrismaClient } from '@prisma/client/scripts/default-deno-edge.js';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Bindings } from 'hono/types';
import { decode, sign, verify } from 'hono/jwt'
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';
// const app = new Hono<
//   Bindings: {
//     DATABASE_URL : string 
//     // Typescript needs to specify the type of env variable 
//     // This is how it it done in Hono
//     // We can use ts-ignore alternately
//   }
// >()

const app = new Hono();

app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);



export default app
