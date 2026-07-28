# Graph Report - .  (2026-07-27)

## Corpus Check
- 108 files · ~145,979 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 236 nodes · 298 edges · 57 communities (12 shown, 45 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Phase 1 Plans & Summaries
- Feature Definitions
- Core Architecture & Stack
- Retention & Engagement Design
- Chat UX Features
- Voice & Media Recording
- PWA Infrastructure & UI
- Architecture Patterns
- Agent Workflow (AI Roles)
- Planning State & Milestones
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56

## God Nodes (most connected - your core abstractions)
1. `Phase 2 Context` - 16 edges
2. `Phase 1 Research` - 13 edges
3. `Plan 01-01: Project Scaffold & Supabase Foundation` - 12 edges
4. `CoupleSpace` - 11 edges
5. `React 19.2` - 11 edges
6. `CoupleSpace` - 10 edges
7. `Supabase Storage` - 10 edges
8. `Plan 01-02: Authentication & Pairing System` - 9 edges
9. `Plan 01-03: Profile Management & App Shell` - 9 edges
10. `Supabase-First Architecture` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Mobile-First Design Approach` --conceptually_related_to--> `CoupleSpace`  [EXTRACTED]
  docs/UIUX.md → .planning/research/SUMMARY.md
- `FastAPI 0.139` --implements--> `Voice Message Recording & Playback`  [INFERRED]
  .planning/research/STACK.md → docs/Features.md
- `Zustand 5.x State Management` --shares_data_with--> `Agenda/Calendar Feature`  [INFERRED]
  .planning/research/STACK.md → docs/Features.md
- `Zustand 5.x State Management` --shares_data_with--> `Homepage Dashboard Feature`  [INFERRED]
  .planning/research/STACK.md → docs/Features.md
- `Co-located CSS Files` --conceptually_related_to--> `Feature-Based Code Organization`  [INFERRED]
  AGENTS.md → .planning/milestones/v1.0-phases/01-foundation-pairing/01-RESEARCH.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Agent Pipeline: Planner-Coder-Verifier-Reviewer Workflow** — concept_orchestrator_role, concept_agent_pipeline, concept_verifier_role, concept_reviewer_role [EXTRACTED 1.00]
- **Supabase Infrastructure: Auth + Database + Storage + Realtime** — concept_supabase_first, concept_supabase_auth, concept_supabase_database, concept_supabase_storage, concept_supabase_realtime [EXTRACTED 1.00]
- **Phase 1 Foundation: Scaffold + Auth + Profile + Pairing + App Shell** — .planning_milestones_v1.0_phases_01-foundation-pairing_01-01_plan, .planning_milestones_v1.0_phases_01-foundation-pairing_01-02_plan, .planning_milestones_v1.0_phases_01-foundation-pairing_01-03_plan, concept_feature_auth, concept_feature_pairing, concept_feature_profile [EXTRACTED 1.00]
- **Phase 2 Real-Time Chat Feature Set** — concept_whatsapp_style_chat, concept_supabase_realtime_sync, concept_offline_message_queue, concept_delivery_read_indicators, concept_typing_indicators, concept_message_grouping, concept_auto_scroll_new_messages_button, concept_inline_quote_reply, concept_emoji_reaction_system, concept_message_deletion, concept_chat_settings_system, concept_push_notifications [EXTRACTED 1.00]
- **Phase 3 Voice, Image & Album Feature Set** — concept_hold_to_record_voice, concept_live_waveform_visualization, concept_client_side_image_compression, concept_shared_photo_album, concept_supabase_storage_pair_scoped_rls, concept_mediarecorder_api, concept_react_audio_visualize [EXTRACTED 1.00]
- **Core Architecture Patterns** — concept_supabase_first_pattern, concept_pair_id_access_key, concept_optimistic_ui_pattern, concept_pwa_shell_workbox, concept_fastapi_proxy_layer, concept_feature_based_structure [EXTRACTED 1.00]
- **Supabase Full Service Stack** — concept_supabase, concept_supabase_auth, concept_supabase_realtime, concept_supabase_storage, concept_supabase_postgres, concept_rls [INFERRED]
- **Core Technology Stack Decision** — concept_react_19, concept_vite_6, concept_supabase, concept_fastapi, concept_vercel, concept_zustand, concept_vite_pwa_plugin, concept_motion [INFERRED]
- **Rejected Technologies (Anti-Patterns)** — concept_anti_pattern_redux, concept_anti_pattern_cra, concept_anti_pattern_nextjs, concept_anti_pattern_firebase, concept_anti_pattern_socketio, concept_anti_pattern_axios [INFERRED]
- **Explicitly NOT Building (Anti-Features)** — concept_explicitly_not_building, concept_no_ai_coaching, concept_no_video_calling, concept_no_social_features [INFERRED]
- **Critical Risk Trio** — concept_dual_user_churn, concept_privacy_breach_catastrophe, concept_ios_pwa_limitations [INFERRED]
- **Phase Ordering Dependency Chain** — phase_1_foundation, phase_2_chat, phase_3_media, phase_4_homepage, phase_5_agenda, phase_6_polish [INFERRED]
- **Chat Feature Cluster** — feature_chat, feature_message_reply, feature_emoji_reactions, feature_voice_messages, feature_image_sharing, feature_pairing, concept_supabase_realtime [INFERRED]
- **Homepage Feature Cluster** — feature_homepage, feature_mood_tracker, feature_mini_album, feature_spotify_integration, concept_anniversary_counter, concept_daily_rituals [INFERRED]
- **Agenda Feature Cluster** — feature_agenda, feature_google_calendar, feature_date_reminders, concept_google_calendar_api [INFERRED]
- **Developer Experience Toolchain** — concept_oxlint, concept_vitest, concept_oxc_plugin_react, concept_css_colocated, concept_jsx_no_typescript, concept_gsd_workflow [INFERRED]
- **PWA Infrastructure** — concept_vite_pwa_plugin, concept_workbox, concept_manifest_pwa, concept_app_shell, concept_offline_first, concept_push_notifications, concept_ios_pwa_limitations [INFERRED]
- **UI Identity System** — docs_uiux_cosmic_v2, docs_uiux_mobile_first, docs_uiux_card_components, concept_press_start_2p, concept_theme_color_purple, concept_css_colocated [INFERRED]
- **Churn & Retention Design Pattern** — concept_dual_user_churn, concept_four_horsemen_of_churn, concept_couply_case_study, concept_daily_rituals, concept_random_memory_highlight [INFERRED]
- **Future Roadmap Features (v2+)** — docs_roadmap_realtime_location, docs_roadmap_virtual_pet, docs_roadmap_minigames [INFERRED]
- **Repository Structure & Architecture** — doc_agents_md, concept_feature_based_org, concept_protected_routes, concept_supabase_first, concept_pair_id, concept_css_colocated, concept_jsx_no_typescript [INFERRED]

## Communities (57 total, 45 thin omitted)

### Community 0 - "Phase 1 Plans & Summaries"
Cohesion: 0.12
Nodes (31): Plan 01-01: Project Scaffold & Supabase Foundation, Plan 01-01 Summary, Plan 01-02: Authentication & Pairing System, Plan 01-02 Summary, Plan 01-03: Profile Management & App Shell, Plan 01-03 Summary, Phase 1 Context, Phase 1 Discussion Log (+23 more)

### Community 1 - "Feature Definitions"
Cohesion: 0.10
Nodes (28): Authentication Feature, Real-Time Chat Feature, Image Sharing Feature, Shared Photo Album Feature, MediaRecorder API, Optimistic UI with Supabase Realtime Reconciliation, PairID Universal Access Key, PendingTempIds Optimistic Messages (+20 more)

### Community 2 - "Core Architecture & Stack"
Cohesion: 0.09
Nodes (23): CoupleSpace, Co-located CSS Files, date-fns Date Utilities, Feature-Based Code Organization, GSD Workflow System, iOS PWA Limitations, JSX (No TypeScript), lucide-react Icons (+15 more)

### Community 3 - "Retention & Engagement Design"
Cohesion: 0.15
Nodes (20): Anniversary/Days Counter, Chat Settings with Theme, Font, Notifications, Couply Case Study (500K downloads, churn), Daily Rituals & Ambient Presence, Dual-User Churn Risk, FastAPI 0.139, Four Horsemen of Churn, Google Calendar API v3 (+12 more)

### Community 4 - "Chat UX Features"
Cohesion: 0.17
Nodes (18): Auto-Scroll with New Messages Button, Delivery and Read Status Indicators, Emoji Reaction System with Toggle, Inline Quote Reply System, Message Deletion for Self and Everyone, Message Grouping by Sender and Time Gap, Supabase Realtime Message Synchronization, Typing Indicators (+10 more)

### Community 5 - "Voice & Media Recording"
Cohesion: 0.18
Nodes (16): Client-Side Image Compression via Canvas API, Hold-to-Record Voice Messages, Live Waveform Visualization During Recording, Browser MediaRecorder API for Voice Capture, react-audio-visualize Library for Waveforms, Shared Photo Album with Mini and Full Views, Voice Message Recording and Playback Flow, Plan 03-01: Voice & Image Sharing Implementation (+8 more)

### Community 6 - "PWA Infrastructure & UI"
Cohesion: 0.20
Nodes (14): React SPA App Shell, PWA Manifest (manifest.webmanifest), Press Start 2P Font, Theme Color #B87CFF (Purple), AGENTS.md - CoupleSpace Agent Config, Features.md - Feature Definitions, index.html - PWA Entry Point, Roadmap.md - Future Features (+6 more)

### Community 7 - "Architecture Patterns"
Cohesion: 0.20
Nodes (14): FastAPI as Business Logic + API Proxy Layer, Feature-Based Component Structure, Mobile-First PWA Design, Offline Message Queue with Sync, Optimistic UI with Supabase Realtime Reconciliation, PairID as Universal Access Key, Privacy by Design for Relationship Data, PWA Shell with Workbox Offline Strategy (+6 more)

### Community 8 - "Agent Workflow (AI Roles)"
Cohesion: 0.29
Nodes (8): Global Engineering Policy, Orchestrator Agent, Reviewer Agent, Verifier (QA) Agent, Agent Pipeline Workflow, Orchestrator Role, Reviewer Role, Verifier (QA) Role

### Community 9 - "Planning State & Milestones"
Cohesion: 0.39
Nodes (8): Milestones, v1.0 Requirements Archive, v1.0 Milestone Roadmap, CoupleSpace Project, Requirements, Roadmap, Project State, Milestone-Based Development

### Community 10 - "Community 10"
Cohesion: 0.47
Nodes (6): Anti-Features to Explicitly Not Build, Daily Habits for Couple App Retention, Four Horsemen of Churn in Couple Apps, Homepage Dashboard as Primary View Differentiator, Table Stakes Couple App Features, Feature Landscape Research

### Community 11 - "Community 11"
Cohesion: 0.50
Nodes (4): Explicitly NOT Building (Anti-Features), No AI Relationship Coaching, No Social Features/Community, No Video Calling

## Knowledge Gaps
- **81 isolated node(s):** `AlbumGrid`, `AlbumPage`, `AlbumUpload`, `MiniAlbum`, `AuthCallback` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 2 Context` connect `Chat UX Features` to `Retention & Engagement Design`, `Architecture Patterns`?**
  _High betweenness centrality (0.259) - this node is a cross-community bridge._
- **Why does `Push Notifications for Background Messages` connect `Retention & Engagement Design` to `Chat UX Features`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `React 19.2` (e.g. with `Motion 12.42 (framer-motion)` and `Supabase-First Architecture`) actually correct?**
  _`React 19.2` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AlbumGrid`, `AlbumPage`, `AlbumUpload` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Phase 1 Plans & Summaries` be split into smaller, more focused modules?**
  _Cohesion score 0.11612903225806452 - nodes in this community are weakly interconnected._
- **Should `Feature Definitions` be split into smaller, more focused modules?**
  _Cohesion score 0.10317460317460317 - nodes in this community are weakly interconnected._
- **Should `Core Architecture & Stack` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._