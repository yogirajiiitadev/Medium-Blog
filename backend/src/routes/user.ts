import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
// import { PrismaClient } from '@prisma/client/scripts/default-deno-edge.js';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Bindings } from 'hono/types';
import { decode, sign, verify } from 'hono/jwt'

export const userRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string,
        JWT_SECRET : string
    }
}>();

userRouter.post('/signup', async (c) => {
    try {
      const prisma = new PrismaClient({  
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate());
      // withAccelerate helps us connect to a connection pool instead of 
      // direct connection to Postgres Database
  
      const body = await c.req.json();
        const user = await prisma.user.create({
          data: {
            email: body.email,
            password: body.password,
          },
        });  
      const token = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({ jwt: token });
    } catch (error) {
      c.status(403);
      console.error('Error occurred in signup:', error);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  });
  
  
userRouter.post('/signin', async(c) => {
try {
    const prisma = new PrismaClient({  
    datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    // withAccelerate helps us connect to a connection pool instead of 
    // direct connection to Postgres Database

    const body = await c.req.json();
    const user = await prisma.user.findUnique({
        where: {
        email: body.email,
        },
    });  

    if(!user){
    c.status(403);
    return c.json({
        error : "User does not exist!"
    })
    }
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt: token });
} catch (error) {
    c.status(403);
    console.error('Error occurred in signin:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
}
});