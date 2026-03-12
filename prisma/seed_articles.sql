-- SQL Script to seed 9 articles and link them to the first available user
-- This script uses a DO block to handle variables and ensure data integrity.

DO $$
DECLARE
    v_user_id uuid;
    v_article_id uuid;
BEGIN
    -- 1. Get a user to assign articles to (the first one found)
    SELECT id INTO v_user_id FROM public.users WHERE active = true AND deleted = false LIMIT 1;

    -- Check if a user exists
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No active user found in the "users" table. Cannot assign articles.';
        RETURN;
    END IF;

    RAISE NOTICE 'Assigning articles to user ID: %', v_user_id;

    -- Article 1: Technology
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'The Future of AI in Web Development',
        'Artificial Intelligence is revolutionizing how we build web applications. From intelligent code completion to automated testing and personalized user experiences, AI tools are becoming indispensable for modern developers. This article explores the latest trends and what lies ahead.',
        'Technology',
        'published',
        true,
        false,
        NOW() - interval '9 days',
        NOW() - interval '9 days',
        NOW() - interval '9 days',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);


    -- Article 2: Health
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'Tips for Maintaining Mental Wellness',
        'In our fast-paced world, taking care of your mental health is just as important as physical health. Simple practices like mindfulness, regular exercise, and adequate sleep can make a significant difference. Learn practical tips to stay balanced.',
        'Health',
        'published',
        true,
        false,
        NOW() - interval '8 days',
        NOW() - interval '8 days',
        NOW() - interval '8 days',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);


    -- Article 3: Science
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'Recent Breakthroughs in Quantum Computing',
        'Quantum computing promises to solve problems that are currently intractable for classical computers. Recent experiments have demonstrated quantum supremacy in specific tasks. We dive into what this means for the future of cryptography and material science.',
        'Science',
        'published',
        true,
        false,
        NOW() - interval '7 days',
        NOW() - interval '7 days',
        NOW() - interval '7 days',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);


    -- Article 4: Lifestyle
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'Essential Minimalist Habits for a Better Life',
        'Minimalism is not just about owning fewer things; it is about focusing on what truly matters. By decluttering your physical and digital space, you can find more clarity and peace. Here are 5 habits to get started.',
        'Lifestyle',
        'published',
        true,
        false,
        NOW() - interval '6 days',
        NOW() - interval '6 days',
        NOW() - interval '6 days',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);


    -- Article 5: Education
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'Modern Learning Techniques for Students',
        'The way we learn is evolving. Techniques like active recall and spaced repetition are proven to enhance memory retention. This guide explains how to apply these methods effectively in your studies.',
        'Education',
        'published',
        true,
        false,
        NOW() - interval '5 days',
        NOW() - interval '5 days',
        NOW() - interval '5 days',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);


    -- Article 6: Work
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'Remote Work Best Practices in 2026',
        'Remote work is here to stay. To stay productive and connected, teams need the right tools and communication strategies. We discuss best practices for managing remote teams and maintaining work-life balance.',
        'Work',
        'published',
        true,
        false,
        NOW() - interval '4 days',
        NOW() - interval '4 days',
        NOW() - interval '4 days',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);


    -- Article 7: Travel
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'Top 10 Hidden Gems to Visit in Europe',
        'Beyond the popular tourist destinations lie charming small towns and breathtaking landscapes waiting to be explored. From the coast of Portugal to the mountains of Slovenia, discover these hidden European gems.',
        'Travel',
        'published',
        true,
        false,
        NOW() - interval '3 days',
        NOW() - interval '3 days',
        NOW() - interval '3 days',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);


    -- Article 8: Food
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'Sustainable Eating: A Guide to Eco-Friendly Diets',
        'Our food choices have a direct impact on the environment. Adopting a sustainable diet involves choosing local, seasonal produce and reducing food waste. Learn how small changes can contribute to a healthier planet.',
        'Food',
        'published',
        true,
        false,
        NOW() - interval '2 days',
        NOW() - interval '2 days',
        NOW() - interval '2 days',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);


    -- Article 9: Art
    INSERT INTO public.articles (title, content, category, status, active, deleted, created_at, updated_at, published_at, images)
    VALUES (
        'Digital Art Trends to Watch This Year',
        'Digital art is exploding with creativity, driven by new software and hardware. We look at the emerging trends, from 3D modeling to generative art, and highlight some of the most exciting artists in the field.',
        'Art',
        'published',
        true,
        false,
        NOW() - interval '1 day',
        NOW() - interval '1 day',
        NOW() - interval '1 day',
        '["/ImageExempleBlog.png"]'
    )
    RETURNING id INTO v_article_id;

    INSERT INTO public.user_article (user_id, article_id) VALUES (v_user_id, v_article_id);

    RAISE NOTICE 'Successfully seeded 9 articles.';
END $$;
