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

    public struct Language has store, copy, drop {
        language: String,
        proficiency: String,
    }

    public struct Education has store, copy, drop {
        institution: String,  // Institution name
        course: String,       // Course/Program name
        degree: String,       // Degree/Level (e.g., Bachelor's, Master's, PhD)
        start_date: String,   // Start date (e.g., "2020-09")
        end_date: String,     // End date (e.g., "2024-06" or "Present")
    }

    public struct Certificate has store, copy, drop {
        name: String,
        link: String,
        date: u64,
    }

    public struct ContactItem has store, copy, drop {
        value: String,
        is_private: bool,
    }

    /// Candidate Profile - owned object
    public struct CandidateProfile has key, store {
        id: UID,
        name: String,
        bio: String,
        portfolio: vector<String>,
        skills: vector<String>,
        location: String,
        nationalities: vector<String>,
        preferred_currency: String,
        picture_url: String,
        location_private: bool,
        nationalities_private: bool,
        contact_info: vector<ContactItem>,
        
        // New detailed fields
        languages: vector<Language>,
        education: vector<Education>,
        certificates: vector<Certificate>,

        hourly_rate: u64,
        emergency_rate: Option<u64>,
        minimal_engagement_time: Option<u64>,
        owner: address,
        status: u8,
        verified: bool,
        verified_by: Option<address>,
        verified_at: Option<u64>,
        // Privacy hashes
        location_hash: Option<vector<u8>>,
        nationalities_hash: Option<vector<u8>>,
        contact_hash: Option<vector<u8>>,
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

    public struct CandidateVerified has copy, drop {  
        profile_id: ID,
        verified_by: address,
    }

    public struct CandidateUnverified has copy, drop {
        profile_id: ID,
        unverified_by: address,
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

        // Note: Display for vector might need careful handling, but standard string interpolation for first element isn't directly supported by Move Display standard simply for vectors. 
        // We'll skip project_url for now or just not show it in explorer display to avoid confusion.
        // vector::push_back(&mut keys, std::string::utf8(b"project_url"));
        // vector::push_back(&mut values, std::string::utf8(b"{portfolio}"));

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
        portfolio: vector<String>,
        skills: vector<String>,
        location: String,
        nationalities: vector<String>,
        preferred_currency: String,
        picture_url: String,
        location_private: bool,
        nationalities_private: bool,
        contact_info_values: vector<String>,
        contact_info_private: vector<bool>,
        
        // New detailed arguments
        language_names: vector<String>,
        language_proficiencies: vector<String>,
        
        education_institutions: vector<String>,  // Institution names
        education_courses: vector<String>,       // Course/Program names
        education_degrees: vector<String>,       // Degrees/Levels
        education_start_dates: vector<String>,   // Start dates
        education_end_dates: vector<String>,     // End dates
        
        cert_names: vector<String>,
        cert_links: vector<String>,
        cert_dates: vector<u64>,

        hourly_rate: u64,
        emergency_rate_value: u64,
        emergency_rate_enabled: bool,
        minimal_engagement_time_value: u64,
        minimal_engagement_time_enabled: bool,
        // Optional privacy hashes (pass empty vector if unused)
        location_hash_bytes: vector<u8>,
        nationalities_hash_bytes: vector<u8>,
        contact_hash_bytes: vector<u8>,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let profile_id = object::uid_to_inner(&id);
        let owner = tx_context::sender(ctx);

        // Contact Info
        let mut contact_info = vector::empty<ContactItem>();
        let len = vector::length(&contact_info_values);
        let mut i = 0;
        while (i < len) {
            let value = *vector::borrow(&contact_info_values, i);
            let is_private = *vector::borrow(&contact_info_private, i);
            vector::push_back(&mut contact_info, ContactItem { value, is_private });
            i = i + 1;
        };

        // Languages
        let mut languages = vector::empty<Language>();
        let len_langs = vector::length(&language_names);
        let mut j = 0;
        while (j < len_langs) {
            let language = *vector::borrow(&language_names, j);
            let proficiency = *vector::borrow(&language_proficiencies, j);
            vector::push_back(&mut languages, Language { language, proficiency });
            j = j + 1;
        };

        // Education
        let mut education = vector::empty<Education>();
        let len_edu = vector::length(&education_institutions);
        let mut k = 0;
        while (k < len_edu) {
            let institution = *vector::borrow(&education_institutions, k);
            let course = *vector::borrow(&education_courses, k);
            let degree = *vector::borrow(&education_degrees, k);
            let start_date = *vector::borrow(&education_start_dates, k);
            let end_date = *vector::borrow(&education_end_dates, k);
            vector::push_back(&mut education, Education {
                institution,
                course,
                degree,
                start_date,
                end_date,
            });
            k = k + 1;
        };

        // Certificates
        let mut certificates = vector::empty<Certificate>();
        let len_certs = vector::length(&cert_names);
        let mut l = 0;
        while (l < len_certs) {
            let name = *vector::borrow(&cert_names, l);
            let link = *vector::borrow(&cert_links, l);
            let date = *vector::borrow(&cert_dates, l);
            vector::push_back(&mut certificates, Certificate { name, link, date });
            l = l + 1;
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

        let location_hash = if (vector::is_empty(&location_hash_bytes)) { option::none() } else { option::some(location_hash_bytes) };
        let nationalities_hash = if (vector::is_empty(&nationalities_hash_bytes)) { option::none() } else { option::some(nationalities_hash_bytes) };
        let contact_hash = if (vector::is_empty(&contact_hash_bytes)) { option::none() } else { option::some(contact_hash_bytes) };

        let profile = CandidateProfile {
            id,
            name,
            bio,
            portfolio,
            skills,
            location,
            nationalities,
            preferred_currency,
            picture_url,
            location_private,
            nationalities_private,
            contact_info,
            languages,
            education,
            certificates,
            hourly_rate,
            emergency_rate,
            minimal_engagement_time,
            owner,
            status: STATUS_ACTIVE,
            verified: false,
            verified_by: option::none(),
            verified_at: option::none(),
            location_hash,
            nationalities_hash,
            contact_hash,
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
            portfolio: profile.portfolio,
            skills: profile.skills,
            location: profile.location,
            nationalities: profile.nationalities,
            preferred_currency: profile.preferred_currency,
            picture_url: profile.picture_url,
            location_private: profile.location_private,
            nationalities_private: profile.nationalities_private,
            contact_info: profile.contact_info,
            languages: profile.languages,
            education: profile.education,
            certificates: profile.certificates,
            hourly_rate: profile.hourly_rate,
            emergency_rate: profile.emergency_rate,
            minimal_engagement_time: profile.minimal_engagement_time,
            owner,
            status: STATUS_MODIFIED,
            verified: false,  // Cloned profiles start unverified
            verified_by: option::none(),
            verified_at: option::none(),
            location_hash: profile.location_hash,
            nationalities_hash: profile.nationalities_hash,
            contact_hash: profile.contact_hash,
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
        portfolio: vector<String>,
        skills: vector<String>,
        location: String,
        nationalities: vector<String>,
        preferred_currency: String,
        picture_url: String,
        location_private: bool,
        nationalities_private: bool,
        contact_info_values: vector<String>,
        contact_info_private: vector<bool>,
        
        // New detailed arguments
        language_names: vector<String>,
        language_proficiencies: vector<String>,
        
        education_institutions: vector<String>,  // Institution names
        education_courses: vector<String>,       // Course/Program names
        education_degrees: vector<String>,       // Degrees/Levels
        education_start_dates: vector<String>,   // Start dates
        education_end_dates: vector<String>,     // End dates
        
        cert_names: vector<String>,
        cert_links: vector<String>,
        cert_dates: vector<u64>,

        hourly_rate: u64,
        emergency_rate_value: u64,
        emergency_rate_enabled: bool,
        minimal_engagement_time_value: u64,
        minimal_engagement_time_enabled: bool,
        // Optional privacy hashes
        location_hash_bytes: vector<u8>,
        nationalities_hash_bytes: vector<u8>,
        contact_hash_bytes: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == profile.owner, ENotAuthorized);

        // Rebuild vectors
        let mut contact_info = vector::empty<ContactItem>();
        let len = vector::length(&contact_info_values);
        let mut i = 0;
        while (i < len) {
            let value = *vector::borrow(&contact_info_values, i);
            let is_private = *vector::borrow(&contact_info_private, i);
            vector::push_back(&mut contact_info, ContactItem { value, is_private });
            i = i + 1;
        };

        let mut languages = vector::empty<Language>();
        let len_langs = vector::length(&language_names);
        let mut j = 0;
        while (j < len_langs) {
            let language = *vector::borrow(&language_names, j);
            let proficiency = *vector::borrow(&language_proficiencies, j);
            vector::push_back(&mut languages, Language { language, proficiency });
            j = j + 1;
        };

        let mut education = vector::empty<Education>();
        let len_edu = vector::length(&education_institutions);
        let mut k = 0;
        while (k < len_edu) {
            let institution = *vector::borrow(&education_institutions, k);
            let course = *vector::borrow(&education_courses, k);
            let degree = *vector::borrow(&education_degrees, k);
            let start_date = *vector::borrow(&education_start_dates, k);
            let end_date = *vector::borrow(&education_end_dates, k);
            vector::push_back(&mut education, Education {
                institution,
                course,
                degree,
                start_date,
                end_date,
            });
            k = k + 1;
        };

        let mut certificates = vector::empty<Certificate>();
        let len_certs = vector::length(&cert_names);
        let mut l = 0;
        while (l < len_certs) {
            let name = *vector::borrow(&cert_names, l);
            let link = *vector::borrow(&cert_links, l);
            let date = *vector::borrow(&cert_dates, l);
            vector::push_back(&mut certificates, Certificate { name, link, date });
            l = l + 1;
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

        let location_hash = if (vector::is_empty(&location_hash_bytes)) { option::none() } else { option::some(location_hash_bytes) };
        let nationalities_hash = if (vector::is_empty(&nationalities_hash_bytes)) { option::none() } else { option::some(nationalities_hash_bytes) };
        let contact_hash = if (vector::is_empty(&contact_hash_bytes)) { option::none() } else { option::some(contact_hash_bytes) };

        profile.name = name;
        profile.bio = bio;
        profile.portfolio = portfolio;
        profile.skills = skills;
        profile.location = location;
        profile.nationalities = nationalities;
        profile.preferred_currency = preferred_currency;
        profile.picture_url = picture_url;
        profile.location_private = location_private;
        profile.nationalities_private = nationalities_private;
        profile.contact_info = contact_info;
        
        profile.languages = languages;
        profile.education = education;
        profile.certificates = certificates;

        profile.hourly_rate = hourly_rate;
        profile.emergency_rate = emergency_rate;
        profile.minimal_engagement_time = minimal_engagement_time;
        profile.location_hash = location_hash;
        profile.nationalities_hash = nationalities_hash;
        profile.contact_hash = contact_hash;

        event::emit(ProfileUpdated {
            profile_id: object::uid_to_inner(&profile.id),
            owner: profile.owner,
        });
    }

    // ===== Public Setters for Admin Module =====
    
    /// Set verification status (to be called by admin module)
    public fun set_verified(
        profile: &mut CandidateProfile,
        verified: bool,
        verified_by: Option<address>,
        verified_at: Option<u64>
    ) {
        profile.verified = verified;
        profile.verified_by = verified_by;
        profile.verified_at = verified_at;
    }

    // ===== Getters =====

    public fun get_name(profile: &CandidateProfile): String {
        profile.name
    }

    public fun get_bio(profile: &CandidateProfile): String {
        profile.bio
    }

    public fun get_portfolio(profile: &CandidateProfile): vector<String> {
        profile.portfolio
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

    public fun get_nationalities(profile: &CandidateProfile): vector<String> {
        profile.nationalities
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

    public fun is_nationalities_private(profile: &CandidateProfile): bool {
        profile.nationalities_private
    }

    public fun get_location_hash(profile: &CandidateProfile): Option<vector<u8>> {
        profile.location_hash
    }

    public fun get_nationalities_hash(profile: &CandidateProfile): Option<vector<u8>> {
        profile.nationalities_hash
    }

    public fun get_contact_hash(profile: &CandidateProfile): Option<vector<u8>> {
        profile.contact_hash
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
