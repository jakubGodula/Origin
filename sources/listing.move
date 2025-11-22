module origin::listing {
//    use sui::object;
//    use sui::transfer;
//    use sui::tx_context;
    // ===== Imports =====
    use sui::event;
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use origin::marketplace::{Self, Marketplace};

    // ===== Errors =====
    const ENotJobPoster: u64 = 0;
    const EJobAlreadyClosed: u64 = 1;
    const EInvalidBudget: u64 = 2;
    const EJobNotOpen: u64 = 3;
    const EAlreadyApplied: u64 = 4;

    // ===== Structs =====
    
    /// Job listing object
    public struct Listing has key, store {
        id: UID,
        poster: address,
        title: String,
        description: String,
        details: String,
        requirements: String,
        budget: u64,
        currency: String,  // "SUI" initially
        deadline: u64,     // timestamp
        status: u8,        // 0=Open, 1=InProgress, 2=Completed, 3=Cancelled
        applicants: Table<address, bool>, // Track applicants to prevent duplicates
        applicant_count: u64,
        selected_freelancer: Option<address>,
        created_at: u64,
        escrow_id: Option<ID>,
    }

    /// Job application
    public struct JobApplication has key, store {
        id: UID,
        job_id: ID,
        applicant: address,
        proposal: String,
        proposed_price: u64,
        estimated_delivery: u64,
        applied_at: u64,
    }

    // ===== Events =====
    
    public struct JobCreated has copy, drop {
        job_id: ID,
        poster: address,
        budget: u64,
        title: String,
    }

    public struct JobApplicationSubmitted has copy, drop {
        job_id: ID,
        application_id: ID,
        applicant: address,
    }

    public struct FreelancerSelected has copy, drop {
        job_id: ID,
        freelancer: address,
    }

    public struct JobCompleted has copy, drop {
        job_id: ID,
        freelancer: address,
    }

    // ===== Constants =====
    const STATUS_OPEN: u8 = 0;
    const STATUS_IN_PROGRESS: u8 = 1;
    const STATUS_COMPLETED: u8 = 2;
    const STATUS_CANCELLED: u8 = 3;

    // ===== Public Functions =====
    
    /// Create a new job listing
    public entry fun create_job(
        marketplace: &mut Marketplace,
        title: vector<u8>,
        description: vector<u8>,
        details: vector<u8>,
        requirements: vector<u8>,
        budget: u64,
        deadline: u64,
        ctx: &mut TxContext
    ) {
        assert!(budget > 0, EInvalidBudget);
        
        let job_id = object::new(ctx);
        let job_uid = object::uid_to_inner(&job_id);
        
        let job = Listing {
            id: job_id,
            poster: tx_context::sender(ctx),
            title: string::utf8(title),
            description: string::utf8(description),
            details: string::utf8(details),
            requirements: string::utf8(requirements),
            budget,
            currency: string::utf8(b"SUI"),
            deadline,
            status: STATUS_OPEN,
            applicants: table::new(ctx),
            applicant_count: 0,
            selected_freelancer: option::none(),
            created_at: tx_context::epoch(ctx),
            escrow_id: option::none(),
        };
        
        marketplace::increment_jobs(marketplace);

        event::emit(JobCreated {
            job_id: job_uid,
            poster: tx_context::sender(ctx),
            budget,
            title: string::utf8(title),
        });
        
        transfer::share_object(job);
    }

    /// Apply to a job
    public entry fun apply_to_job(
        job: &mut Listing,
        proposal: vector<u8>,
        proposed_price: u64,
        estimated_delivery: u64,
        ctx: &mut TxContext
    ) {
        assert!(job.status == STATUS_OPEN, EJobNotOpen);
        
        let applicant = tx_context::sender(ctx);
        assert!(!table::contains(&job.applicants, applicant), EAlreadyApplied);
        
        table::add(&mut job.applicants, applicant, true);
        job.applicant_count = job.applicant_count + 1;
        
        let application_id = object::new(ctx);
        let application_uid = object::uid_to_inner(&application_id);
        
        let application = JobApplication {
            id: application_id,
            job_id: object::uid_to_inner(&job.id),
            applicant,
            proposal: string::utf8(proposal),
            proposed_price,
            estimated_delivery,
            applied_at: tx_context::epoch(ctx),
        };
        
        event::emit(JobApplicationSubmitted {
            job_id: object::uid_to_inner(&job.id),
            application_id: application_uid,
            applicant,
        });
        
        transfer::transfer(application, job.poster);
    }

    /// Select a freelancer (job poster only)
    public entry fun select_freelancer(
        job: &mut Listing,
        freelancer: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == job.poster, ENotJobPoster);
        assert!(job.status == STATUS_OPEN, EJobAlreadyClosed);
        
        job.status = STATUS_IN_PROGRESS;
        job.selected_freelancer = option::some(freelancer);
        
        event::emit(FreelancerSelected {
            job_id: object::uid_to_inner(&job.id),
            freelancer,
        });
    }

    /// Cancel job (poster only, only if open)
    public entry fun cancel_job(
        job: &mut Listing,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == job.poster, ENotJobPoster);
        assert!(job.status == STATUS_OPEN, EJobAlreadyClosed);
        
        job.status = STATUS_CANCELLED;
    }

    // ===== Getters =====
    
    public fun get_status(job: &Listing): u8 {
        job.status
    }

    public fun get_poster(job: &Listing): address {
        job.poster
    }

    public fun get_selected_freelancer(job: &Listing): Option<address> {
        job.selected_freelancer
    }
    
    public fun get_applicant_count(job: &Listing): u64 {
        job.applicant_count
    }
}
