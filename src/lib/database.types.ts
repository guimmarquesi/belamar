export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberRole = "master" | "player" | "guest";
export type PotionRarityDb = "sem" | "comum" | "incomum" | "raro" | "super_raro";
export type QuestKindDb = "principal" | "secundaria";
export type QuestStatusDb = "ativa" | "concluida" | "falhada";

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type CampaignRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  is_open: boolean;
  created_at: string;
  updated_at: string;
};

export type CampaignMemberRow = {
  campaign_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
};

export type CharacterRow = {
  id: string;
  campaign_id: string;
  owner_id: string | null;
  name: string;
  portrait_url: string | null;
  data: Json;
  created_at: string;
  updated_at: string;
};

export type BagItemRow = {
  id: string;
  campaign_id: string;
  legacy_id: string;
  name: string;
  description: string;
  quantity: number;
  owner_character_id: string | null;
  created_by: string | null;
  updated_at: string;
};

export type CampaignCoinsRow = {
  campaign_id: string;
  gold: number;
  silver: number;
  bronze: number;
  updated_at: string;
};

export type ItemRow = {
  id: string;
  campaign_id: string;
  legacy_id: string;
  name: string;
  description: string | null;
  rarity: string | null;
  hidden: boolean;
  owner_character_id: string | null;
  data: Json;
  created_at: string;
  updated_at: string;
};

export type NpcRow = {
  id: string;
  campaign_id: string;
  legacy_id: string;
  name: string;
  relation: string | null;
  faction: string | null;
  portrait_url: string | null;
  summary: string | null;
  accent: string | null;
  sigil: string | null;
  created_at: string;
  updated_at: string;
};

export type PotionRow = {
  id: string;
  campaign_id: string;
  legacy_id: string;
  name: string;
  effect: string;
  rarity: PotionRarityDb;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type QuestRow = {
  id: string;
  campaign_id: string;
  legacy_id: string;
  title: string;
  kind: QuestKindDb;
  status: QuestStatusDb;
  summary: string | null;
  notes: string | null;
  linked_marker_ids: string[];
  legacy_created_at: number | null;
  created_at: string;
  updated_at: string;
};

export type MapMarkerRow = {
  id: string;
  campaign_id: string;
  legacy_id: string;
  name: string;
  x: number;
  y: number;
  marker_type: string | null;
  data: Json;
  updated_at: string;
};

export type CampaignDocumentRow = {
  campaign_id: string;
  key: string;
  value: Json;
  updated_by: string | null;
  updated_at: string;
};

export type CampaignInviteRow = {
  id: string;
  campaign_id: string;
  token: string;
  role: MemberRole;
  created_by: string;
  expires_at: string | null;
  max_uses: number;
  uses: number;
  active: boolean;
  created_at: string;
};

export type ActivityLogRow = {
  id: number;
  campaign_id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  before_data: Json | null;
  after_data: Json | null;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, { id: string; display_name: string; avatar_url?: string | null }>;
      campaigns: Table<
        CampaignRow,
        { id?: string; name: string; slug: string; owner_id: string; is_open?: boolean; created_at?: string; updated_at?: string }
      >;
      campaign_members: Table<CampaignMemberRow>;
      characters: Table<CharacterRow>;
      bag_items: Table<
        BagItemRow,
        {
          id?: string;
          campaign_id: string;
          legacy_id?: string;
          name: string;
          description?: string;
          quantity?: number;
          owner_character_id?: string | null;
          created_by?: string | null;
          updated_at?: string;
        }
      >;
      campaign_coins: Table<
        CampaignCoinsRow,
        { campaign_id: string; gold?: number; silver?: number; bronze?: number; updated_at?: string }
      >;
      items: Table<ItemRow>;
      npcs: Table<NpcRow>;
      potions: Table<PotionRow>;
      quests: Table<QuestRow>;
      map_markers: Table<MapMarkerRow>;
      campaign_documents: Table<
        CampaignDocumentRow,
        { campaign_id: string; key: string; value?: Json; updated_by?: string | null; updated_at?: string }
      >;
      campaign_invites: Table<
        CampaignInviteRow,
        {
          id?: string;
          campaign_id: string;
          token?: string;
          role?: MemberRole;
          created_by: string;
          expires_at?: string | null;
          max_uses?: number;
          uses?: number;
          active?: boolean;
          created_at?: string;
        }
      >;
      activity_log: Table<ActivityLogRow>;
    };
    Views: { [_ in never]: never };
    Functions: {
      set_my_characters: {
        Args: { target_campaign: string; selected_characters?: string[] };
        Returns: undefined;
      };
      join_open_campaign: {
        Args: { target_campaign: string; selected_role: MemberRole; selected_characters?: string[] };
        Returns: string;
      };
      accept_campaign_invite: {
        Args: { invite_token: string };
        Returns: string;
      };
    };
    Enums: {
      campaign_role: MemberRole;
      potion_rarity: PotionRarityDb;
      quest_kind: QuestKindDb;
      quest_status: QuestStatusDb;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
