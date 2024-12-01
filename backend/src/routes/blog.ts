import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
// import { PrismaClient } from '@prisma/client/scripts/default-deno-edge.js';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Bindings } from 'hono/types';
import { decode, sign, verify } from 'hono/jwt'

export const blogRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string,
        JWT_SECRET : string
    },
    Variables : {
        userId : string,
    }
}>();

// MiddleWare
// we can use c.set() and c.get() property of context to use 
// the user id in our routes after middleware logic.
blogRouter.use('/*', async (c,next) => {
    // This logic is only applied to routes mentioned in the above * format
    // Verify the head, if correct proceed, else block.
    const authHeader = c.req.header("authorization") || "";
    // Bearer space token
    const token = authHeader.split(" ")[1];
    try {
        const user = await verify(token, c.env.JWT_SECRET)
        if(user){
            c.set("userId", user.id); 
            // context does not have a userId key. We have to define it explicitly while Hono initializaton
            await next(); //proceed
        }
        else{
            c.status(403);
            c.json({
                error : "Unauthorized Access!"
            })
        }
    }
    catch(e) {
        c.status(403);
        c.status(403);
        c.json({
            error : "You are not logged in!"
        })
    }
  })

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const authorId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const blog = await prisma.blog.create({
        data : {
            title : body.title,
            content : body.content,
            authorId : Number(authorId)
        }
    });
    return c.json({
        id : blog.id
    })
});

blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const blog = await prisma.blog.update({
        where : {
            id : body.id
        },
        data : {
            title : body.title,
            content : body.content,
        }
    })
    return c.json({
        id : blog.id
    })
});

// Todo : add pagination
blogRouter.get('/bulk', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const blogs = await prisma.blog.findMany();
    return c.json({
        blogs
    });
});

blogRouter.get('/:id', async(c) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.blog.findFirst({
            where : {
                id : Number(id)
            }
        })
        return c.json({
            blog
        })
    } catch (e) {
        c.status(411);
        return c.json({
            message : "Error while fetching blog post!"
        })
    } 
});

