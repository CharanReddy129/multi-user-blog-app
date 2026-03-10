require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./src/lib/db');

async function seed() {
    try {
        console.log('🌱 Seeding database with raw pg...');

        // 1. Check if admin exists to avoid re-seeding endlessly
        const { rows: existingAdmin } = await pool.query(
            'SELECT * FROM "User" WHERE email = $1',
            ['admin@blog.com']
        );

        if (existingAdmin.length > 0) {
            console.log('✅ Admin user already exists. Skipping seed.');
            process.exit(0);
        }

        // 2. Hash passwords
        const adminHash = await bcrypt.hash('admin123', 10);
        const userHash = await bcrypt.hash('user123', 10);

        // 3. Insert Users
        console.log('👤 Creating users...');
        const userInsertQuery = `
            INSERT INTO "User" (name, email, "passwordHash", role)
            VALUES 
            ('Admin User', 'admin@blog.com', $1, 'ADMIN'),
            ('Demo User', 'demo@blog.com', $2, 'USER')
            RETURNING id, email
        `;
        const { rows: users } = await pool.query(userInsertQuery, [adminHash, userHash]);
        const adminId = users.find(u => u.email === 'admin@blog.com').id;
        const demoUserId = users.find(u => u.email === 'demo@blog.com').id;

        // 4. Insert Posts
        console.log('📝 Creating posts...');
        const postInsertQuery = `
            INSERT INTO "Post" (title, slug, content, published, "authorId", "updatedAt")
            VALUES 
            (
                'Getting Started with DevOps', 
                'getting-started-with-devops', 
                '# Getting Started with DevOps\n\nDevOps is a set of practices...', 
                true, 
                $1, 
                NOW()
            ),
            (
                'Docker for Beginners', 
                'docker-for-beginners', 
                '# Docker for Beginners\n\nDocker is a platform for building...', 
                true, 
                $2, 
                NOW()
            )
            RETURNING id, slug
        `;
        const { rows: posts } = await pool.query(postInsertQuery, [adminId, demoUserId]);
        const devOpsPostId = posts.find(p => p.slug === 'getting-started-with-devops').id;
        const dockerPostId = posts.find(p => p.slug === 'docker-for-beginners').id;

        // 5. Insert Comments
        console.log('💬 Creating comments...');
        const commentInsertQuery = `
            INSERT INTO "Comment" (content, "authorId", "postId")
            VALUES 
            ('Great introduction!', $1, $2),
            ('This helped me understand containers perfectly, thanks!', $3, $4)
        `;
        await pool.query(commentInsertQuery, [demoUserId, devOpsPostId, adminId, dockerPostId]);

        console.log('✅ Seeding finished.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seed();
