package com.ssafy.s14p11a707.scenario.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@RequiredArgsConstructor
public enum RoomAsset {

    // ==========================================
    //  지하실 (Basement)
    // ==========================================
    OBJECT1("object1", 32, 32, "basement", "top wall"), // clock
    OBJECT2("object2", 32, 64, "basement", "top wall"), // arcade
    OBJECT3("object3", 32, 64, "basement", "top wall"), // arcade
    OBJECT4("object4", 64, 32, "basement", "top wall"), // fireplace
    OBJECT5("object5", 64, 32, "basement", "top wall"), // fireplace
    OBJECT6("object6", 32, 64, "basement", "top wall"), // arcade
    OBJECT7("object7", 96, 64, "basement", "center"), // pool
    OBJECT8("object8", 96, 64, "basement", "center"), // pool
    OBJECT9("object9", 64, 32, "basement", "top wall"), // rack
    OBJECT10("object10", 32, 32, "basement", "top wall"), // dartboard
    OBJECT11("object11", 32, 64, "basement", "top wall"), // arcade
    OBJECT12("object12", 96, 64, "basement", "center"), // pool
    OBJECT13("object13", 96, 64, "basement", "center"), // pool
    OBJECT14("object14", 64, 32, "basement", "top wall"), // bar

    // ==========================================
    //  욕실 (Bathroom)
    // ==========================================
    OBJECT15("object15", 32, 64, "bathroom", "top wall"), // shower
    OBJECT16("object16", 32, 64, "bathroom", "top wall"), // shower
    OBJECT17("object17", 32, 32, "bathroom", "top wall"), // toilet
    OBJECT18("object18", 32, 32, "bathroom", "top wall"), // sink
    OBJECT19("object19", 64, 32, "bathroom", "top wall"), // bathtub
    OBJECT20("object20", 32, 32, "bathroom", "anywhere"), // toilet
    OBJECT21("object21", 32, 32, "bathroom", "anywhere"), // toilet
    OBJECT22("object22", 32, 32, "bathroom", "anywhere"), // sink
    OBJECT23("object23", 32, 32, "bathroom", "anywhere"), // toilet
    OBJECT24("object24", 32, 32, "bathroom", "anywhere"), // toilet
    OBJECT25("object25", 32, 32, "bathroom", "anywhere"), // toilet
    OBJECT26("object26", 32, 32, "bathroom", "anywhere"), // toilet
    OBJECT27("object27", 32, 32, "bathroom", "top wall"), // sink
    OBJECT32("object32", 32, 32, "bathroom", "top wall"), // sink
    OBJECT33("object33", 32, 32, "bathroom", "top wall"), // sink
    OBJECT34("object34", 32, 32, "bathroom", "floor"), // mat
    OBJECT35("object35", 32, 32, "bathroom", "floor"), // mat
    OBJECT36("object36", 32, 32, "bathroom", "floor"), // mat
    OBJECT37("object37", 32, 32, "bathroom", "top wall"), // mirror
    OBJECT38("object38", 16, 16, "bathroom", "top wall"), // medicine
    OBJECT39("object39", 16, 16, "bathroom", "top wall"), // medicine
    OBJECT40("object40", 16, 16, "bathroom", "top wall"), // medicine
    OBJECT41("object41", 16, 16, "bathroom", "top wall"), // medicine
    OBJECT42("object42", 16, 16, "bathroom", "top wall"), // medicine

    // ==========================================
    //  침실 (Bedroom)
    // ==========================================
    OBJECT43("object43", 48, 80, "bedroom", "top wall"), // bed
    OBJECT44("object44", 48, 80, "bedroom", "top wall"), // bed
    OBJECT45("object45", 32, 48, "bedroom", "anywhere"), // crib
    OBJECT46("object46", 48, 80, "bedroom", "top wall"), // bed
    OBJECT47("object47", 48, 80, "bedroom", "top wall"), // bed
    OBJECT48("object48", 48, 80, "bedroom", "top wall"), // bed
    OBJECT49("object49", 24, 24, "bedroom", "anywhere"), // stool
    OBJECT50("object50", 24, 24, "bedroom", "anywhere"), // stool
    OBJECT51("object51", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT52("object52", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT53("object53", 64, 32, "bedroom", "top wall"), // bookcase
    OBJECT54("object54", 64, 32, "bedroom", "top wall"), // bookcase
    OBJECT55("object55", 32, 64, "bedroom", "top wall"), // cabinet
    OBJECT56("object56", 32, 64, "bedroom", "top wall"), // cabinet
    OBJECT57("object57", 32, 64, "bedroom", "top wall"), // display
    OBJECT58("object58", 32, 64, "bedroom", "top wall"), // display
    OBJECT59("object59", 40, 64, "bedroom", "top wall"), // wardrobe
    OBJECT60("object60", 40, 64, "bedroom", "top wall"), // wardrobe
    OBJECT61("object61", 64, 24, "bedroom", "top wall"), // shelf
    OBJECT62("object62", 64, 24, "bedroom", "top wall"), // shelf
    OBJECT63("object63", 48, 80, "bedroom", "top wall"), // bed
    OBJECT64("object64", 48, 80, "bedroom", "top wall"), // bed
    OBJECT65("object65", 48, 80, "bedroom", "top wall"), // bed
    OBJECT66("object66", 48, 80, "bedroom", "top wall"), // bed
    OBJECT67("object67", 48, 80, "bedroom", "top wall"), // bed
    OBJECT68("object68", 48, 80, "bedroom", "top wall"), // bed
    OBJECT69("object69", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT70("object70", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT71("object71", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT72("object72", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT73("object73", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT74("object74", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT75("object75", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT76("object76", 32, 32, "bedroom", "anywhere"), // chair
    OBJECT77("object77", 48, 80, "bedroom", "top wall"), // bed
    OBJECT78("object78", 48, 80, "bedroom", "top wall"), // bed
    OBJECT79("object79", 48, 80, "bedroom", "top wall"), // bed
    OBJECT80("object80", 48, 80, "bedroom", "top wall"), // bed
    OBJECT81("object81", 48, 80, "bedroom", "top wall"), // bed
    OBJECT82("object82", 48, 80, "bedroom", "top wall"), // bed
    OBJECT83("object83", 48, 80, "bedroom", "top wall"), // bed
    OBJECT84("object84", 48, 80, "bedroom", "top wall"), // bed
    OBJECT85("object85", 48, 80, "bedroom", "top wall"), // bed
    OBJECT86("object86", 48, 80, "bedroom", "top wall"), // bed
    OBJECT87("object87", 48, 80, "bedroom", "top wall"), // bed
    OBJECT88("object88", 48, 80, "bedroom", "top wall"), // bed
    OBJECT89("object89", 48, 80, "bedroom", "top wall"), // bed
    OBJECT90("object90", 48, 80, "bedroom", "top wall"), // bed
    OBJECT91("object91", 48, 80, "bedroom", "top wall"), // bed
    OBJECT92("object92", 48, 80, "bedroom", "top wall"), // bed
    OBJECT93("object93", 48, 80, "bedroom", "top wall"), // bed
    OBJECT94("object94", 48, 80, "bedroom", "top wall"), // bed

    // ==========================================
    //  공용 / 기타 (Anywhere)
    // ==========================================
    OBJECT95("object95", 64, 24, "any", "top wall"), // shelf
    OBJECT96("object96", 64, 24, "any", "top wall"), // shelf
    OBJECT97("object97", 32, 32, "any", "top wall"), // clock
    OBJECT98("object98", 32, 32, "any", "top wall"), // clock
    OBJECT99("object99", 32, 32, "any", "top wall"), // clock
    OBJECT100("object100", 32, 32, "any", "top wall"), // clock
    OBJECT101("object101", 32, 32, "any", "top wall"), // clock
    OBJECT102("object102", 32, 32, "any", "top wall"), // clock
    OBJECT103("object103", 32, 32, "any", "top wall"), // clock
    OBJECT104("object104", 32, 32, "any", "top wall"), // clock
    OBJECT105("object105", 32, 32, "any", "top wall"), // clock
    OBJECT106("object106", 32, 32, "any", "top wall"), // clock
    OBJECT107("object107", 32, 32, "any", "top wall"), // clock
    OBJECT108("object108", 32, 32, "any", "top wall"), // clock

    // ==========================================
    //  부엌 (Kitchen)
    // ==========================================
    OBJECT132("object132", 32, 64, "kitchen", "top wall"), // refrigerator
    OBJECT133("object133", 32, 64, "kitchen", "top wall"), // refrigerator
    OBJECT134("object134", 32, 32, "kitchen", "top wall"), // stove
    OBJECT135("object135", 32, 32, "kitchen", "top wall"), // oven
    OBJECT136("object136", 32, 32, "kitchen", "top wall"), // stove
    OBJECT137("object137", 32, 32, "kitchen", "top wall"), // stove
    OBJECT138("object138", 32, 32, "kitchen", "top wall"), // stove
    OBJECT139("object139", 32, 32, "kitchen", "top wall"), // stove
    OBJECT140("object140", 32, 32, "kitchen", "top wall"), // stove
    OBJECT141("object141", 32, 32, "kitchen", "top wall"), // stove
    OBJECT142("object142", 32, 32, "kitchen", "top wall"), // stove
    OBJECT143("object143", 32, 32, "kitchen", "top wall"), // stove
    OBJECT144("object144", 32, 32, "kitchen", "top wall"), // stove
    OBJECT145("object145", 32, 32, "kitchen", "top wall"), // stove
    OBJECT146("object146", 32, 32, "kitchen", "top wall"), // stove
    OBJECT147("object147", 32, 32, "kitchen", "top wall"), // stove
    OBJECT148("object148", 32, 32, "kitchen", "top wall"), // stove
    OBJECT149("object149", 32, 32, "kitchen", "top wall"), // stove
    OBJECT150("object150", 32, 32, "kitchen", "top wall"), // stove
    OBJECT151("object151", 32, 32, "kitchen", "top wall"), // stove
    OBJECT152("object152", 32, 32, "kitchen", "top wall"), // stove
    OBJECT153("object153", 32, 32, "kitchen", "top wall"), // stove
    OBJECT154("object154", 32, 32, "kitchen", "top wall"), // stove
    OBJECT155("object155", 32, 32, "kitchen", "top wall"), // stove
    OBJECT156("object156", 32, 32, "kitchen", "top wall"), // stove
    OBJECT157("object157", 32, 32, "kitchen", "top wall"), // stove
    OBJECT158("object158", 32, 32, "kitchen", "top wall"), // sink
    OBJECT159("object159", 32, 32, "kitchen", "top wall"), // sink
    OBJECT160("object160", 32, 32, "kitchen", "top wall"), // sink
    OBJECT161("object161", 32, 32, "kitchen", "top wall"), // sink
    OBJECT162("object162", 32, 32, "kitchen", "top wall"), // sink
    OBJECT163("object163", 32, 32, "kitchen", "top wall"), // sink
    OBJECT164("object164", 32, 32, "kitchen", "top wall"), // sink
    OBJECT165("object165", 32, 32, "kitchen", "top wall"), // sink
    OBJECT166("object166", 32, 32, "kitchen", "top wall"), // sink
    OBJECT167("object167", 32, 32, "kitchen", "top wall"), // sink
    OBJECT168("object168", 32, 32, "kitchen", "top wall"), // sink
    OBJECT169("object169", 32, 32, "kitchen", "top wall"), // sink
    OBJECT170("object170", 32, 32, "kitchen", "top wall"), // sink
    OBJECT171("object171", 32, 32, "kitchen", "top wall"), // sink
    OBJECT172("object172", 32, 32, "kitchen", "top wall"), // sink
    OBJECT173("object173", 32, 32, "kitchen", "top wall"), // sink
    OBJECT174("object174", 32, 32, "kitchen", "top wall"), // sink
    OBJECT175("object175", 32, 32, "kitchen", "top wall"), // sink
    OBJECT176("object176", 32, 32, "kitchen", "top wall"), // sink
    OBJECT177("object177", 32, 32, "kitchen", "top wall"), // sink
    OBJECT178("object178", 32, 32, "kitchen", "top wall"), // sink
    OBJECT179("object179", 32, 32, "kitchen", "top wall"), // sink
    OBJECT180("object180", 32, 32, "kitchen", "top wall"), // sink
    OBJECT181("object181", 32, 32, "kitchen", "top wall"), // sink
    OBJECT182("object182", 32, 32, "kitchen", "top wall"), // sink
    OBJECT183("object183", 32, 32, "kitchen", "top wall"), // sink
    OBJECT184("object184", 32, 32, "kitchen", "top wall"), // sink
    OBJECT185("object185", 32, 32, "kitchen", "top wall"), // sink
    OBJECT186("object186", 32, 32, "kitchen", "top wall"), // sink
    OBJECT187("object187", 32, 32, "kitchen", "top wall"), // sink
    OBJECT188("object188", 32, 32, "kitchen", "top wall"), // sink
    OBJECT189("object189", 32, 32, "kitchen", "top wall"), // sink
    OBJECT190("object190", 32, 32, "kitchen", "top wall"), // sink
    OBJECT191("object191", 32, 32, "kitchen", "top wall"), // sink
    OBJECT192("object192", 32, 32, "kitchen", "top wall"), // sink
    OBJECT193("object193", 32, 32, "kitchen", "top wall"), // sink
    OBJECT194("object194", 32, 32, "kitchen", "top wall"), // sink
    OBJECT195("object195", 32, 32, "kitchen", "top wall"), // sink
    OBJECT196("object196", 32, 32, "kitchen", "top wall"), // sink
    OBJECT197("object197", 32, 32, "kitchen", "top wall"), // sink
    OBJECT198("object198", 32, 32, "kitchen", "top wall"), // sink
    OBJECT199("object199", 32, 32, "kitchen", "top wall"), // sink
    OBJECT200("object200", 32, 32, "kitchen", "top wall"), // sink
    OBJECT201("object201", 32, 32, "kitchen", "top wall"), // sink
    OBJECT202("object202", 32, 32, "kitchen", "top wall"), // sink
    OBJECT203("object203", 32, 32, "kitchen", "top wall"), // sink
    OBJECT204("object204", 32, 32, "kitchen", "top wall"), // sink
    OBJECT205("object205", 32, 32, "kitchen", "top wall"), // sink
    OBJECT206("object206", 32, 32, "kitchen", "top wall"), // sink
    OBJECT207("object207", 32, 32, "kitchen", "top wall"), // sink
    OBJECT208("object208", 32, 32, "kitchen", "top wall"), // sink
    OBJECT209("object209", 32, 32, "kitchen", "top wall"), // sink
    OBJECT210("object210", 32, 32, "kitchen", "top wall"), // sink
    OBJECT211("object211", 32, 32, "kitchen", "top wall"), // sink
    OBJECT212("object212", 32, 32, "kitchen", "top wall"), // sink
    OBJECT213("object213", 32, 32, "kitchen", "top wall"), // sink
    OBJECT214("object214", 32, 32, "kitchen", "top wall"), // sink
    OBJECT215("object215", 32, 32, "kitchen", "top wall"), // sink
    OBJECT216("object216", 32, 32, "kitchen", "top wall"), // sink
    OBJECT217("object217", 32, 32, "kitchen", "top wall"), // sink
    OBJECT218("object109", 16, 48, "any", "anywhere"), // lamp
    OBJECT219("object110", 16, 48, "any", "anywhere"), // lamp
    OBJECT220("object111", 16, 48, "any", "anywhere"), // lamp
    OBJECT221("object112", 16, 48, "any", "anywhere"), // lamp
    OBJECT222("object113", 16, 48, "any", "anywhere"), // lamp
    OBJECT223("object114", 16, 48, "any", "anywhere"), // lamp
    OBJECT224("object115", 16, 48, "any", "anywhere"), // lamp
    OBJECT225("object116", 16, 48, "any", "anywhere"), // lamp
    OBJECT226("object117", 16, 48, "any", "anywhere"), // lamp
    OBJECT227("object118", 16, 48, "any", "anywhere"), // lamp
    OBJECT228("object119", 16, 48, "any", "anywhere"), // lamp
    OBJECT229("object120", 16, 48, "any", "anywhere"), // lamp
    OBJECT230("object121", 16, 48, "any", "anywhere"), // lamp
    OBJECT231("object122", 16, 48, "any", "anywhere"), // lamp
    OBJECT232("object123", 16, 48, "any", "anywhere"), // lamp
    OBJECT233("object124", 16, 48, "any", "anywhere"), // lamp
    OBJECT234("object125", 16, 48, "any", "anywhere"), // lamp
    OBJECT235("object126", 16, 48, "any", "anywhere"), // lamp
    OBJECT236("object127", 16, 48, "any", "anywhere"), // lamp
    OBJECT237("object128", 16, 48, "any", "anywhere"), // lamp
    OBJECT238("object129", 16, 48, "any", "anywhere"), // lamp
    OBJECT239("object130", 16, 48, "any", "anywhere"), // lamp
    OBJECT240("object131", 16, 48, "any", "anywhere"), // lamp

    // ==========================================
    //  거실 (Living Room)
    // ==========================================
    OBJECT241("object241", 64, 64, "living", "center"), // table
    OBJECT242("object242", 64, 64, "living", "center"), // table
    OBJECT243("object243", 64, 64, "living", "center"), // table
    OBJECT244("object244", 64, 64, "living", "center"), // table
    OBJECT245("object245", 64, 64, "living", "center"), // table
    OBJECT246("object246", 64, 64, "living", "center"), // table
    OBJECT247("object247", 64, 64, "living", "center"), // table
    OBJECT248("object248", 64, 64, "living", "center"), // table
    OBJECT249("object249", 64, 32, "living", "top wall"), // sofa
    OBJECT250("object250", 64, 32, "living", "top wall"), // sofa
    OBJECT251("object251", 64, 32, "living", "top wall"), // sofa
    OBJECT252("object252", 64, 32, "living", "top wall"), // sofa
    OBJECT253("object253", 64, 32, "living", "top wall"), // sofa
    OBJECT254("object254", 64, 32, "living", "top wall"), // sofa
    OBJECT255("object255", 64, 32, "living", "top wall"), // sofa
    OBJECT256("object256", 64, 32, "living", "top wall"), // sofa
    OBJECT257("object257", 64, 32, "living", "top wall"), // sofa
    OBJECT258("object258", 64, 32, "living", "top wall"), // sofa
    OBJECT259("object259", 64, 32, "living", "top wall"), // sofa
    OBJECT260("object260", 64, 32, "living", "top wall"), // sofa
    OBJECT261("object261", 64, 32, "living", "top wall"), // sofa
    OBJECT262("object262", 64, 32, "living", "top wall"), // sofa
    OBJECT263("object263", 64, 32, "living", "top wall"), // sofa
    OBJECT264("object264", 64, 32, "living", "top wall"), // sofa
    OBJECT265("object265", 64, 32, "living", "top wall"), // sofa
    OBJECT266("object266", 64, 32, "living", "top wall"), // sofa
    OBJECT267("object267", 64, 32, "living", "top wall"), // sofa
    OBJECT268("object268", 64, 32, "living", "top wall"), // sofa
    OBJECT269("object269", 64, 32, "living", "top wall"), // sofa
    OBJECT270("object270", 64, 32, "living", "top wall"), // sofa
    OBJECT271("object271", 64, 32, "living", "top wall"), // sofa
    OBJECT272("object272", 64, 32, "living", "top wall"), // sofa
    OBJECT273("object273", 64, 32, "living", "top wall"), // sofa
    OBJECT274("object274", 64, 32, "living", "top wall"), // sofa
    OBJECT275("object275", 64, 32, "living", "top wall"), // sofa
    OBJECT276("object276", 64, 32, "living", "top wall"), // sofa
    OBJECT277("object277", 64, 32, "living", "top wall"), // sofa
    OBJECT278("object278", 64, 32, "living", "top wall"), // sofa
    OBJECT279("object279", 64, 32, "living", "top wall"), // sofa
    OBJECT280("object280", 64, 32, "living", "top wall"), // sofa
    OBJECT281("object281", 64, 32, "living", "top wall"), // sofa
    OBJECT282("object282", 64, 32, "living", "top wall"), // sofa
    OBJECT283("object283", 64, 32, "living", "top wall"), // sofa
    OBJECT284("object284", 64, 32, "living", "top wall"), // sofa
    OBJECT285("object285", 64, 32, "living", "top wall"), // sofa
    OBJECT286("object286", 64, 32, "living", "top wall"), // sofa
    OBJECT287("object287", 64, 32, "living", "top wall"), // sofa
    OBJECT288("object288", 64, 32, "living", "top wall"), // sofa
    OBJECT289("object289", 32, 32, "living", "anywhere"), // chair
    OBJECT296("object296", 64, 32, "living", "top wall"), // sofa
    OBJECT297("object297", 64, 32, "living", "top wall"), // sofa
    OBJECT298("object298", 64, 32, "living", "top wall"), // sofa
    OBJECT299("object299", 64, 32, "living", "top wall"), // sofa
    OBJECT300("object300", 64, 32, "living", "top wall"), // sofa
    OBJECT301("object301", 64, 32, "living", "top wall"), // sofa
    OBJECT302("object302", 64, 32, "living", "top wall"), // sofa
    OBJECT303("object303", 64, 32, "living", "top wall"), // sofa
    OBJECT304("object304", 64, 32, "living", "top wall"), // sofa
    OBJECT305("object305", 64, 32, "living", "top wall"), // sofa
    OBJECT306("object306", 64, 32, "living", "top wall"), // sofa
    OBJECT307("object307", 64, 32, "living", "top wall"), // sofa
    OBJECT308("object308", 64, 32, "living", "top wall"), // sofa
    OBJECT309("object309", 64, 32, "living", "top wall"), // sofa
    OBJECT310("object310", 32, 32, "living", "anywhere"), // chair
    OBJECT311("object311", 32, 32, "living", "anywhere"), // chair
    OBJECT312("object312", 32, 32, "living", "anywhere"), // chair
    OBJECT313("object313", 32, 32, "living", "anywhere"), // chair
    OBJECT314("object314", 64, 32, "living", "top wall"), // sofa
    OBJECT315("object315", 64, 32, "living", "top wall"), // sofa
    OBJECT316("object316", 64, 32, "living", "top wall"), // sofa
    OBJECT317("object317", 64, 32, "living", "top wall"), // sofa
    OBJECT318("object318", 64, 32, "living", "top wall"); // sofa

    private final String objectName;
    private final int width;
    private final int height;
    private final String roomType;
    private final String placement;

    /**
     * 특정 방(roomType)에 해당하는 에셋 목록 반환
     * (공용 아이템 'any' 포함)
     */
    public static List<RoomAsset> getAssetsByRoomType(String roomType) {
        return Arrays.stream(values())
                .filter(asset -> asset.roomType.equals("any") ||
                        asset.roomType.equalsIgnoreCase(roomType))
                .collect(Collectors.toList());
    }
}