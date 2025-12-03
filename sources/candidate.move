module origin::candidate {
    use std::string::{String};
    use sui::event;

    use sui::package;
    use sui::display;

    // ===== Errors =====
    const ENotAuthorized: u64 = 0;

    // ===== Constants =====
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_MODIFIED: u8 = 1;

    // ===== Structs =====

    /// OTW for the module
    public struct CANDIDATE has drop {}

    public struct ContactItem has store, copy, drop {
        value: String,
        is_private: bool,
    }

    /// Candidate Profile - owned object
    public struct CandidateProfile has key, store {
        id: UID,
        name: String,
        bio: String,
        portfolio_link: String,
        skills: vector<String>,
        location: String,
        nationality: String,
        preferred_currency: String,
        picture_url: String,
        location_private: bool,
        nationality_private: bool,
        contact_info: vector<ContactItem>,
        hourly_rate: u64,
        emergency_rate: Option<u64>,
        minimal_engagement_time: Option<u64>,
        owner: address,
        status: u8,
    }

    // ===== Events =====

    public struct ProfileCreated has copy, drop {
        profile_id: ID,
        owner: address,
        status: u8,
    }

    public struct ProfileUpdated has copy, drop {
        profile_id: ID,
        owner: address,
    }

    // ===== Public Functions =====

    fun init(otw: CANDIDATE, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);

        let mut keys = vector::empty<String>();
        let mut values = vector::empty<String>();

        vector::push_back(&mut keys, std::string::utf8(b"name"));
        vector::push_back(&mut values, std::string::utf8(b"{name}"));

        vector::push_back(&mut keys, std::string::utf8(b"description"));
        vector::push_back(&mut values, std::string::utf8(b"{bio}"));

        vector::push_back(&mut keys, std::string::utf8(b"image_url"));
        vector::push_back(&mut values, std::string::utf8(b"{picture_url}"));

        vector::push_back(&mut keys, std::string::utf8(b"project_url"));
        vector::push_back(&mut values, std::string::utf8(b"{portfolio_link}"));

        let mut display = display::new_with_fields<CandidateProfile>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    /// Create a new candidate profile
    public entry fun create_profile(
        name: String,
        bio: String,
        portfolio_link: String,
        skills: vector<String>,
        location: String,
        nationality: String,
        preferred_currency: String,
        picture_url: String,
        location_private: bool,
        nationality_private: bool,
        contact_info_values: vector<String>,
        contact_info_private: vector<bool>,
        hourly_rate: u64,
        emergency_rate_value: u64,
        emergency_rate_enabled: bool,
        minimal_engagement_time_value: u64,
        minimal_engagement_time_enabled: bool,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let profile_id = object::uid_to_inner(&id);
        let owner = tx_context::sender(ctx);

        let mut contact_info = vector::empty<ContactItem>();
        let len = vector::length(&contact_info_values);
        let mut i = 0;
        while (i < len) {
            let value = *vector::borrow(&contact_info_values, i);
            let is_private = *vector::borrow(&contact_info_private, i);
            vector::push_back(&mut contact_info, ContactItem { value, is_private });
            i = i + 1;
        };

        let emergency_rate = if (emergency_rate_enabled) {
            option::some(emergency_rate_value)
        } else {
            option::none()
        };

        let minimal_engagement_time = if (minimal_engagement_time_enabled) {
            option::some(minimal_engagement_time_value)
        } else {
            option::none()
        };

        let profile = CandidateProfile {
            id,
            name,
            bio,
            portfolio_link,
            skills,
            location,
            nationality,
            preferred_currency,
            picture_url,
            location_private,
            nationality_private,
            contact_info,
            hourly_rate,
            emergency_rate,
            minimal_engagement_time,
            owner,
            status: STATUS_ACTIVE,
        };

        event::emit(ProfileCreated {
            profile_id,
            owner,
            status: STATUS_ACTIVE,
        });

        transfer::transfer(profile, owner);
    }

    /// Create a modified copy of an existing profile
    public entry fun clone_profile(
        profile: &CandidateProfile,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let profile_id = object::uid_to_inner(&id);
        let owner = tx_context::sender(ctx);

        let new_profile = CandidateProfile {
            id,
            name: profile.name,
            bio: profile.bio,
            portfolio_link: profile.portfolio_link,
            skills: profile.skills,
            location: profile.location,
            nationality: profile.nationality,
            preferred_currency: profile.preferred_currency,
            picture_url: profile.picture_url,
            location_private: profile.location_private,
            nationality_private: profile.nationality_private,
            contact_info: profile.contact_info,
            hourly_rate: profile.hourly_rate,
            emergency_rate: profile.emergency_rate,
            minimal_engagement_time: profile.minimal_engagement_time,
            owner,
            status: STATUS_MODIFIED,
        };

        event::emit(ProfileCreated {
            profile_id,
            owner,
            status: STATUS_MODIFIED,
        });

        transfer::transfer(new_profile, owner);
    }

    /// Update an existing candidate profile
    public entry fun update_profile(
        profile: &mut CandidateProfile,
        name: String,
        bio: String,
        portfolio_link: String,
        skills: vector<String>,
        location: String,
        nationality: String,
        preferred_currency: String,
        picture_url: String,
        location_private: bool,
        nationality_private: bool,
        contact_info_values: vector<String>,
        contact_info_private: vector<bool>,
        hourly_rate: u64,
        emergency_rate_value: u64,
        emergency_rate_enabled: bool,
        minimal_engagement_time_value: u64,
        minimal_engagement_time_enabled: bool,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.owner, ENotAuthorized);

        let mut contact_info = vector::empty<ContactItem>();
        let len = vector::length(&contact_info_values);
        let mut i = 0;
        while (i < len) {
            let value = *vector::borrow(&contact_info_values, i);
            let is_private = *vector::borrow(&contact_info_private, i);
            vector::push_back(&mut contact_info, ContactItem { value, is_private });
            i = i + 1;
        };

        let emergency_rate = if (emergency_rate_enabled) {
            option::some(emergency_rate_value)
        } else {
            option::none()
        };

        let minimal_engagement_time = if (minimal_engagement_time_enabled) {
            option::some(minimal_engagement_time_value)
        } else {
            option::none()
        };

        profile.name = name;
        profile.bio = bio;
        profile.portfolio_link = portfolio_link;
        profile.skills = skills;
        profile.location = location;
        profile.nationality = nationality;
        profile.preferred_currency = preferred_currency;
        profile.picture_url = picture_url;
        profile.location_private = location_private;
        profile.nationality_private = nationality_private;
        profile.contact_info = contact_info;
        profile.hourly_rate = hourly_rate;
        profile.emergency_rate = emergency_rate;
        profile.minimal_engagement_time = minimal_engagement_time;

        event::emit(ProfileUpdated {
            profile_id: object::uid_to_inner(&profile.id),
            owner: profile.owner,
        });
    }

    // ===== Getters =====

    public fun get_name(profile: &CandidateProfile): String {
        profile.name
    }

    public fun get_bio(profile: &CandidateProfile): String {
        profile.bio
    }

    public fun get_portfolio_link(profile: &CandidateProfile): String {
        profile.portfolio_link
    }

    public fun get_skills(profile: &CandidateProfile): vector<String> {
        profile.skills
    }

    public fun get_contact_info(profile: &CandidateProfile): vector<ContactItem> {
        profile.contact_info
    }

    public fun get_location(profile: &CandidateProfile): String {
        profile.location
    }

    public fun get_nationality(profile: &CandidateProfile): String {
        profile.nationality
    }

    public fun get_preferred_currency(profile: &CandidateProfile): String {
        profile.preferred_currency
    }

    public fun get_picture_url(profile: &CandidateProfile): String {
        profile.picture_url
    }

    public fun is_location_private(profile: &CandidateProfile): bool {
        profile.location_private
    }

    public fun is_nationality_private(profile: &CandidateProfile): bool {
        profile.nationality_private
    }

    public fun get_hourly_rate(profile: &CandidateProfile): u64 {
        profile.hourly_rate
    }

    public fun get_emergency_rate(profile: &CandidateProfile): Option<u64> {
        profile.emergency_rate
    }

    public fun get_minimal_engagement_time(profile: &CandidateProfile): Option<u64> {
        profile.minimal_engagement_time
    }

    public fun get_status(profile: &CandidateProfile): u8 {
        profile.status
    }
}
