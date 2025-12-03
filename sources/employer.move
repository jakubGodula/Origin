module origin::employer {
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
    public struct EMPLOYER has drop {}

    public struct ContactItem has store, copy, drop {
        value: String,
        is_private: bool,
    }

    /// Employer Profile - owned object
    public struct EmployerProfile has key, store {
        id: UID,
        name: String,
        bio: String,
        location: String,
        website: String,
        logo_url: String,
        contact_info: vector<ContactItem>,
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

    fun init(otw: EMPLOYER, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);

        let mut keys = vector::empty<String>();
        let mut values = vector::empty<String>();

        vector::push_back(&mut keys, std::string::utf8(b"name"));
        vector::push_back(&mut values, std::string::utf8(b"{name}"));

        vector::push_back(&mut keys, std::string::utf8(b"description"));
        vector::push_back(&mut values, std::string::utf8(b"{bio}"));

        vector::push_back(&mut keys, std::string::utf8(b"image_url"));
        vector::push_back(&mut values, std::string::utf8(b"{logo_url}"));

        vector::push_back(&mut keys, std::string::utf8(b"project_url"));
        vector::push_back(&mut values, std::string::utf8(b"{website}"));

        let mut display = display::new_with_fields<EmployerProfile>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    /// Create a new employer profile
    public entry fun create_profile(
        name: String,
        bio: String,
        location: String,
        website: String,
        logo_url: String,
        contact_info_values: vector<String>,
        contact_info_private: vector<bool>,
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

        let profile = EmployerProfile {
            id,
            name,
            bio,
            location,
            website,
            logo_url,
            contact_info,
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

    /// Update an existing employer profile
    public entry fun update_profile(
        profile: &mut EmployerProfile,
        name: String,
        bio: String,
        location: String,
        website: String,
        logo_url: String,
        contact_info_values: vector<String>,
        contact_info_private: vector<bool>,
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

        profile.name = name;
        profile.bio = bio;
        profile.location = location;
        profile.website = website;
        profile.logo_url = logo_url;
        profile.contact_info = contact_info;

        event::emit(ProfileUpdated {
            profile_id: object::uid_to_inner(&profile.id),
            owner: profile.owner,
        });
    }

    // ===== Getters =====

    public fun get_name(profile: &EmployerProfile): String {
        profile.name
    }

    public fun get_bio(profile: &EmployerProfile): String {
        profile.bio
    }

    public fun get_location(profile: &EmployerProfile): String {
        profile.location
    }

    public fun get_website(profile: &EmployerProfile): String {
        profile.website
    }

    public fun get_logo_url(profile: &EmployerProfile): String {
        profile.logo_url
    }

    public fun get_contact_info(profile: &EmployerProfile): vector<ContactItem> {
        profile.contact_info
    }

    public fun get_status(profile: &EmployerProfile): u8 {
        profile.status
    }
}
