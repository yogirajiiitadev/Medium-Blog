import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge';
// import { PrismaClient } from '@prisma/client/scripts/default-deno-edge.js';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Bindings } from 'hono/types';
import { decode, sign, verify } from 'hono/jwt'
// const app = new Hono<
//   Bindings: {
//     DATABASE_URL : string 
//     // Typescript needs to specify the type of env variable 
//     // This is how it it done in Hono
//     // We can use ts-ignore alternately
//   }
// >()

const app = new Hono();

// MiddleWare
app.use('/api/v1/blog/*', async (c,next) => {
  // This logic is only applied to routes mentioned in the above * format
  // Verify the head, if correct proceed, else block.
  const header = c.req.header("authorization") || "";
  // Bearer space token
  const token = header.split(" ")[1];

  // @ts-ignore
  const response = await verify(token, c.env.JWT_SECRET)
  if(response.id){
    next(); //proceed
  }
  else{
    c.status(403);
    c.json({
      error : "Unauthorized Access!"
    })
  }
})

app.post('/api/v1/signup', async (c) => {
  try {
    const prisma = new PrismaClient({  
      // @ts-ignore
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
    // @ts-ignore
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    // @ts-ignore
    return c.json({ jwt: token });
  } catch (error) {
    c.status(403);
    console.error('Error occurred in signup:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});


app.post('/api/v1/signin', async(c) => {
  try {
    const prisma = new PrismaClient({  
      // @ts-ignore
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
    // @ts-ignore
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt: token });
  } catch (error) {
    c.status(403);
    console.error('Error occurred in signin:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});


app.post('/api/v1/blog', (c) => {
  return c.text('Hello hono 3!')
});
app.put('/api/v1/blog', (c) => {
  return c.text('Hello hono 4!')
});
app.get('/api/v1/blog/:id', (c) => {
  return c.text('Hello hono 5!')
});

export default app
