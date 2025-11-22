module origin::reputation {
//    use sui::object;
//    use sui::transfer;
//    use sui::tx_context;
    use sui::vec_map::{Self, VecMap};
    use std::string::{Self, String};
    use sui::event;

    // ===== Structs =====
    
    /// User reputation profile
    public struct ReputationProfile has key {
        id: UID,
        user: address,
        total_jobs: u64,
        completed_jobs: u64,
        total_rating: u64,
        rating_count: u64,
        badges: vector<u8>,
        skill_scores: VecMap<String, u64>, // Total score per skill
        skill_counts: VecMap<String, u64>, // Number of ratings per skill
    }

    /// Rating given after job completion
    public struct Rating has key, store {
        id: UID,
        job_id: ID,
        rater: address,
        rated: address,
        score: u8,  // 1-5
        comment: String,
        created_at: u64,
    }

    // ===== Events =====
    
    public struct ReputationUpdated has copy, drop {
        user: address,
        new_average: u64,
        total_ratings: u64,
    }

    public struct SkillRated has copy, drop {
        user: address,
        skill: String,
        new_average: u64,
    }

    // ===== Public Functions =====
    
    public entry fun create_profile(ctx: &mut TxContext) {
        let profile = ReputationProfile {
            id: object::new(ctx),
            user: tx_context::sender(ctx),
            total_jobs: 0,
            completed_jobs: 0,
            total_rating: 0,
            rating_count: 0,
            badges: vector::empty(),
            skill_scores: vec_map::empty(),
            skill_counts: vec_map::empty(),
        };
        
        transfer::transfer(profile, tx_context::sender(ctx));
    }

    public entry fun add_rating(
        profile: &mut ReputationProfile,
        job_id: ID,
        score: u8,
        comment: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(score >= 1 && score <= 5, 0);
        
        profile.total_rating = profile.total_rating + (score as u64);
        profile.rating_count = profile.rating_count + 1;
        
        let rating = Rating {
            id: object::new(ctx),
            job_id,
            rater: tx_context::sender(ctx),
            rated: profile.user,
            score,
            comment: string::utf8(comment),
            created_at: tx_context::epoch(ctx),
        };
        
        event::emit(ReputationUpdated {
            user: profile.user,
            new_average: (profile.total_rating * 100) / profile.rating_count,
            total_ratings: profile.rating_count,
        });
        
        transfer::transfer(rating, profile.user);
    }

    public entry fun rate_skill(
        profile: &mut ReputationProfile,
        skill: String,
        score: u8,
        _ctx: &mut TxContext
    ) {
        assert!(score >= 1 && score <= 5, 0);

        if (!vec_map::contains(&profile.skill_scores, &skill)) {
            vec_map::insert(&mut profile.skill_scores, skill, 0);
            vec_map::insert(&mut profile.skill_counts, skill, 0);
        };

        let current_score = vec_map::get_mut(&mut profile.skill_scores, &skill);
        *current_score = *current_score + (score as u64);

        let current_count = vec_map::get_mut(&mut profile.skill_counts, &skill);
        *current_count = *current_count + 1;

        let avg = (*current_score * 100) / *current_count;

        event::emit(SkillRated {
            user: profile.user,
            skill,
            new_average: avg,
        });
    }

    public fun get_average_rating(profile: &ReputationProfile): u64 {
        if (profile.rating_count == 0) { return 0 };
        (profile.total_rating * 100) / profile.rating_count
    }

    public fun get_skill_average(profile: &ReputationProfile, skill: String): u64 {
        if (!vec_map::contains(&profile.skill_scores, &skill)) { return 0 };
        let total = *vec_map::get(&profile.skill_scores, &skill);
        let count = *vec_map::get(&profile.skill_counts, &skill);
        if (count == 0) { return 0 };
        (total * 100) / count
    }
}
