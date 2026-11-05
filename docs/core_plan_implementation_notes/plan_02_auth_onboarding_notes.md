# Plan 02 — Auth and onboarding implementation notes

**Owner:** Anisha. **Branch:** `landing-page`. **Status:** In progress; see [ledger](../core_plan/02_auth_onboarding.md). **Starting point:** `adc969c` before the introduction increment.

## Resume checkpoint — November 1, 2026

Auth and five questionnaire screens exist on this branch. A new-account confirmation email was received and the account confirmed, though the message landed in Spam. The browser callback encountered a missing initiating verifier; native-device auth and API identity handoff remain unverified. Age and gender are currently transient; the owner wants persistence, while supported age, purpose and privacy details remain open. The uncommitted plan preview is illustrative and does not install a plan. See [Auth QA](../qa/auth-foundation.md), [onboarding scope](../implementation/onboarding-questions.md), [remaining work](../implementation/remaining-work.md) and [native build evidence](../runbooks/native-development-builds.md).

## AUTH-10a — Introduction, commit a9feec4

**Date:** 2026-10-29. **Commit:** `a9feec4` — `feat(onboarding): add first-launch scrolling introduction`. **Owner:** Anisha. Introduces the first-launch Figma flow, navigation and persistence. [Scope and recorded validation](../implementation/landing-intro.md). Signed-device acceptance remains open.

| File at commit | Changed lines in that commit | Purpose |
|---|---|---|
| `README.md` | 8, 122-125 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/assets/intro/arrow-muted.png` | binary asset | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/intro/arrow-white.png` | binary asset | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/intro/dinosaur.png` | binary asset | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/intro/manifest.json` | 1-52 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/intro/originals/arrow-muted.svg` | 1-17 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/intro/originals/arrow-white.svg` | 1-17 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/intro/originals/dinosaur.svg` | 1-12 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/jest.config.cjs` | 1-21 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/package.json` | 9, 14, 32-33, 35, 38-40, 49 | Updates dependencies or scripts needed by the implementation. |
| `apps/mobile/src/app/(onboarding)/welcome.tsx` | 1, 4 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/app/index.tsx` | 1, 3, 5 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/intro/IntroScreen.test.tsx` | 1-53 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/intro/IntroScreen.tsx` | 1-109 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/intro/IntroSurface.tsx` | 1-14 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/intro/IntroSurface.types.ts` | 1-6 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/intro/IntroSurface.web.test.tsx` | 1-70 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/intro/IntroSurface.web.tsx` | 1-40 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/intro/Introduction.test.tsx` | 1-67 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/intro/Introduction.tsx` | 1-103 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/intro/progress.test.ts` | 1-29 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/intro/progress.ts` | 1-20 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/intro/storage.test.ts` | 1-37 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/intro/storage.ts` | 1-26 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/vitest.config.mts` | 7 | Updates app integration, configuration, or navigation for this increment. |
| `docs/AGENT_START_HERE.md` | 11-12 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/core_plan/02_auth_onboarding.md` | 260-261 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/implementation/landing-intro.md` | 1-36 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `package-lock.json` | 26, 31, 49-50, 52, 55-56, 61-81, 110, 455-509, 567-608, 624-636, 649-687, 700-731, deleted, deleted, deleted, 1354-1359, 1361-1379, 1381-1384, 1386-1395, 1397-1402, 1405-1408, 1410-1419, deleted, 1422-1430, 1433-1436, 1438-1447, 1449-1475, 1478-1485, deleted, deleted, 2380, 2493-2497, 2499-2506, 2511-2515, deleted, 2518-2521, 2524-2548, 2551-2553, 2556-2559, 2562-2566, 2569-2575, 2578-2582, 2585-2593, 2596-2636, 2639, 2642-2646, 2649-2653, 2656-2668, 2670-2674, 2677-2680, 2683-2687, deleted, 2690, 2693, 2696-2706, 2708-2709, 2712-2716, 2719, 2722-2726, 2728-2735, 2737, 2740-2744, 2746-2748, 2750, 2753-2757, 2759-2767, 2769, 2772-2788, deleted, 2792, 2795-2799, 2801-2808, 2810, 2813-2817, 2819-2858, 2861-2865, 2867-2869, 2871, 2874-2878, 2880-2895, 2897, 2900-2904, 2906-2916, 2919-2923, 2926-2930, 2932-2933, 2935-2936, 2939-2953, 2955-2956, 2959-2963, 2965-2966, 2969-2973, 2975-2976, 2978-2979, 2982-2992, 2994-3004, 3006-3011, 3013-3014, 3016-3017, 3020-3031, 3034-3044, 3046-3047, 3049-3050, 3053-3058, 3060-3064, 3066-3067, 3070-3074, 3077-3087, 3089-3090, 3093-3107, 3110-3115, 3117-3133, 3135-3136, 3139-3143, 3146-3150, 3152-3170, 3172-3176, 3179-3184, 3186-3187, 3189-3190, 3192-3193, 3196-3200, 3203-3206, 3208-3219, 3221-3222, 3225-3242, 3245, 3247-3248, 3250-3251, 3254-3263, 3265-3266, 3269-3287, 3289-3290, 3292-3293, 3296-3300, 3302-3303, 3306-3310, 3312-3317, 3319, 3322-3326, 3329-3334, 3337-3347, 3350-3354, deleted, 3357, 3360, 3363-3367, deleted, 3370-3376, 3379, 3382-3399, deleted, 3402, 3405-3409, 3412-3417, 3420, 3423-3427, 3430, 3433, 3436-3440, 3442-3450, 3452, 3455-3471, 3473, 3476-3480, 3483, 3486, 3489-3493, 3496-3501, 3504, 3507-3511, 3513-3515, 3517, 3520-3533, 3536, 3539-3556, 3559-3574, 3576-3577, 3580-3585, 3587, 3590-3594, 3597-3600, 3603, 3606-3610, 3613, 3616, 3619-3623, 3625-3632, 3634-3635, 3638-3649, 3651-3654, 3656, 3659-3663, 3666, 3669-3689, deleted, 3692-3717, 3720-3725, 3728-3732, deleted, 3735, 3738, 3741-3745, 3747-3762, 3764, 3767-3771, 3774-3780, 3783, 3786-3800, 3802-3817, deleted, 3820, 3823-3827, 3829-3831, 3833, 3836-3845, deleted, deleted, 3849, 3852-3873, 3875-3887, 3889, 3892-3896, deleted, 3899, 3902-3906, 3908-3915, 3917, 3920-3924, 3926-3932, 3934, 3937-3942, 3944-3952, 3954-3957, 3960-3969, 3971-3974, 3977-3985, 3987, 3990-3995, 3997-4000, 4003-4007, 4009-4011, 4013-4016, 4019-4029, 4031, 4034-4038, 4041-4045, deleted, 4048, 4051-4057, 4059-4070, 4073-4087, 4089-4101, 4103-4113, 4115-4119, 4122-4128, 4131-4135, 4138-4141, 4144-4161, 4163-4167, 4170-4174, 4177-4183, 4186-4190, 4193-4199, 4202-4206, 4209-4212, 4215-4219, 4222-4231, 4234-4238, 4241-4245, 4248-4251, 4254, 4257-4261, 4263-4265, 4267, 4270-4274, 4277-4283, 4286, 4289-4306, deleted, 4309, 4312-4316, 4319-4329, 4332, 4335-4339, 4342-4357, 4359-4360, 4363-4367, 4370-4374, 4377, 4380-4384, 4386-4388, 4390, 4393, 4396-4399, 4403-4417, 4420, 4423-4426, 4428-4435, 4437, 4440-4443, 4446-4447, 4450-4454, 4456-4457, 4460-4464, 4466, 4469-4472, 4475-4476, 4479-4498, 4501, 4503, 4506, 4509-4514, 4517-4520, 4522, 4524, 4527-4530, 4532, deleted, 4537-4541, 4543-4546, 4548, deleted, 4553-4557, 4559-4562, deleted, 4569-4573, 4575-4578, 4580, deleted, 4585-4589, 4591-4594, deleted, 4601-4605, 4607-4610, 4612, deleted, 4618-4621, 4623-4626, 4628, deleted, 4633-4637, 4639-4702, deleted, 4710-4718, 4720-4723, deleted, 4731-4739, 4741-4744, 4746, deleted, 4752-4760, 4762-4765, 4767, 4770-4788, 4790, 4795-4802, 4804-4807, 4809, deleted, 4816-4823, 4825-4828, 4830, deleted, 4837-4844, 4846-4849, 4851, deleted, 4858-4865, 4867-4870, 4872, deleted, 4879-4886, 4888-4891, deleted, 4897-10851, 10853-10856, 10858-10860, 10862-10865, 10868-10877, 10879-10882, 10885-10894, 10896-10900, 10903-10906, 10909-10913, 10915-10917, 10919-10923, 10925-10927, 10929-10933, 10935-10950, 10952-10954, 10956-10959, 10963-10965, 10967-10968, 10971-10974, 10976-10977, 10980-10984, 10986-10990, 10992-10995, 10998-11008, 11010-11015, 11017-11018, 11020-11021, 11024-11028, 11031, 11034-11037, 11040-11044, 11046-11048, 11051-11054, 11057-11060, 11063-11064, 11067-11072, 11074, 11077, 11080-11083, 11086-11087, 11090, 11093-11096, 11099, 11102, 11105, 11108-11118, 11120, 11123, 11126-11130, 11132-11135, 11137-11140, 11143-11146, 11148-11149, 11155, 11158-11161, 11165, 11174-11187, 11191, 11200-11222, 11226-11230, 11239-11243, 11246, 11249, 11252-11255, deleted, 11265-11268, deleted, 11278-11281, deleted, 11284, 11287-11290, 11294-11295, 11304-11307, 11310, 11313-11316, 11318, 11320-11323, 11327-11330, 11339-11343, 11345-11346, 11348-11349, 11352-11356, 11359, 11361-11362, 11364-11365, 11368-11372, 11374-11378, 11381-11389, 11391-11392, 11394-11395, 11398-11401, 11403-11407, 11410-11413, 11416-11424, 11426-11429, 11432-11436, 11438-11442, 11445-11449, 11452, 11455-11458, 11461-11464, 11468-11475, 11478-11481, 11484, 11490-11518, 11520-11524, 11527, 11530-11535, 11537-11542, 11545-11558, 11560-11569, 11571, 11574-11577, 11581-11586, 11590-11599, 11602-11605, 11608-11612, 11614, 11616-11622, 11625-11633, 11636-11640, 11643-11645, 11648, 11651-11655, 11657-11659, 11661, 11664-11668, 11670-11677, 11679-11680, 11683-11694, deleted, 11698, 11701-11704, 11706-11760, 11762-11764, 11766, 11769-11773, 11776-11782, 11784-11800, 11805, 11808-11812, 11824-11828, 11831-11836, 11839, 11842-11846, deleted, 11849-11852, 11855, 11858-11862, 11865-11877, 11880-11888, 11891-11895, 11898, 11901, 11904-11908, 11911-11917, 11920, 11923-11927, 11930-11934, 11936-11940, 11943-11963, 11965-11972, 11974, 11977-11981, 11984-11989, 11992, 11995-11999, 12002-12005, 12008, 12011-12015, 12018-12059, 12062-12066, 12068-12070, 12072, 12075-12079, 12082-12095, 12098, 12101-12105, 12108-12117, 12120-12124, 12127-12131, 12134, 12137, 12140-12144, 12147-12153, 12156, 12158-12159, 12162-12166, 12169-12170, 12173-12176, 12179-12187, 12189-12196, 12199-12203, 12206, 12209, 12212-12216, deleted, 12219, 12222-12226, 12229, 12232, 12235-12245, deleted, 12248, 12251-12263, 12265, 12268-12272, 12275-12281, 12283-12284, 12287-12291, 12294-12304, 12307, 12310-12314, 12317, 12320-12324, 12327-12332, 12335, 12338-12342, 12344-12351, 12353, 12356-12360, 12362-12368, 12370, 12373-12388, 12390-12393, 12396-12401, 12403-12404, 12407-12410, 12413-12417, 12420-12423, 12426, 12429-12440, 12442-12447, 12449-12452, 12455-12459, 12462-12468, 12471-12476, 12478-12516, 12518-12519, 12522, 12525-12530, 12532, 12535, 12538, 12541-12550, 12552, 12555-12559, 12561-12566, 12568, 12571-12575, 12578, 12581, 12584-12588, 12591-12608, 12611-12614, 12617, 12620-12624, 12627, 12630, 12633-12637, 12640-12645, 12648, 12651-12655, 12658, 12661, 12664-12668, 12670-12678, 12680, 12683-12687, 12690-12694, 12700, 12703-12733, 12736-12741, 12743-12757, 12760-12773, 12775-12776, 12779, 12782, 12787-12808, 12812-12815, 12817-12818, 12821-12824, 12827-12833, 12835-12836, 12839-12842, 12844, 12846, 12849-12852, 12856-12867, 12870-12873, 12877-12879, 12882, 12885-12888, 12890, 12892-12905, 12907-12908, 12911-12915, 12918, 12921, 12926-12929, 12933, 12936, 12939-12942, 12946-12949, 12952-12955, 12959-12972, 12975-12991, 12993-13009, 13011, 13014-13030, 13034-13040, 13043, 13046, 13049-13052, 13056-13063, 13066-13069, 13071-13074, 13076-13080, 13083-13093, 13095-13096, 13099-13112, 13116, 13119, 13122-13125, 13127-13132, 13134-13144, 13146-13151, 13154, 13157, 13160-13163, 13165-13172, 13174, 13177-13180, 13182-13185, 13187, 13190, 13193-13196, 13198, 13200-13204, 13207, 13210-13213, 13215, 13217-13223, 13226, 13229-13232, 13234, 13236-13246, 13249, 13252-13255, 13257, 13259, 13262-13265, 13269-13277, 13280-13283, 13285-13293, 13295, 13298-13302, 13304-13310, 13312, 13315-13318, 13320-13330, 13332-13335, 13338-13359, 13362-13365, 13367-13376, 13378, 13381-13391, 13393-13394, 13397-13401, 13404, 13406-13410, 13413-13432, 13435-13436, 13439, 13442-13469, 13472-13482, 13484-13488, 13491-13495, 13498-13499, 13501-13502, 13505-13509, 13512, 13514-13515, 13518-13529, 13531-13535, 13538-13542, 13544-13551, 13554-13558, 13560-13567, 13570-13574, 13576-13580, 13583-13587, 13590-13594, 13596-13600, 13603-13607, 13610-13613, 13615-13616, 13619-13623, 13626-13635, 13637-13638, 13641-13645, 13648, 13650-13651, 13654-13713, 13716-13721, 13724, 13727-13731, 13734-13737, 13739-13740, 13743-13747, 13749-13756, 13759-13763, 13765-13769, 13772-13776, 13779-13785, 13787-13788, 13791-13808, 13811, 13814-13818, 13821-13826, 13828-13829, 13832-13836, 13838-13839, 13842-13846, 13849-13855, 13857-13858, 13861-13865, 13868-13869, 13871-13872, 13875-13879, 13881-13882, 13885-13896, 13898-13915, 13917-13921, 13924-13929, 13931-13934, 13937-13947, 13949-13950, 13953-13957, 13960-13973, 13976-13984, 13986-13990, 13993-14001, 14004-14008, 14010-14016, 14018-14033, 14035-14036, 14039-14053, 14055-14059, 14062, 14065-14068, 14071-14075, 14078-14112, 14115, 14118-14122, 14125-14138, 14141, 14144-14148, 14151-14160, 14163-14167, 14170-14174, deleted, 14180, 14183-14217, 14220, 14223, 14226-14240, 14242-14268, 14271-14275, 14277-14309, 14311, 14314-14318, 14321-14327, 14330, 14333-14337, 14340-14350, 14353, 14356-14360, 14363, 14366-14370, 14372-14379, 14381, 14384-14388, 14390-14399, 14402-14406, 14409-14413, 14416-14436, 14439, 14442-14454, 14456, 14459-14463, 14465-14470, 14472, 14475-14483, 14485, 14488-14492, 14495-14498, 14501-14505, 14508, 14511, 14514, 14517-14522, 14524-14526, 14529, 14532-14537, 14539-14540, 14543, 14546-14550, 14553-14588, 14590-14591, 14594-14598, 14600-14615, 14617, 14620-14625, 14627-14633, 14636-14654, 14656-14660, 14663, 14666, 14670, 14676, 14680, 14689-14710, 14712-14716, 14719-14739, 14741-14742, 14745-14749, 14752, 14755-14759, 14762-14767, 14770, 14773-14777, 14779-14784, 14786-14787, 14790-14794, 14797-14805, 14807, 14810, 14813-14818, 14820-14824, 14827, 14830-14837, 14840-14850, 14853, 14856-14860, 14863, 14866-14870, 14873, 14876, 14879, 14882-14887, 14889-14891, 14894, 14897-14901, 14904-14908, 14911, 14914-14919, 14922-14927, 14929-14933, 14936-14941, 14943, 14946, 14949, 14952-14961, 14963, 14966-14970, 14973-14993, 14996, 14999-15003, 15005-15007, 15009, 15012-15016, 15019-15032, 15035, 15038-15042, 15044-15052, 15054, 15057-15068, 15071-15074, 15077-15095, 15097-15101, 15103-15104, 15107-15111, 15114, 15117, 15120-15130, 15132-15133, 15136-15142, 15144-15149, 15151-15152, 15155, 15158-15162, 15165-15169, 15172, 15175-15180, 15182, 15185, 15188, 15191-15196, 15198-15202, 15205, 15208-15212, 15215-15225, 15228, 15231-15235, deleted, 15238, 15241-15245, 15248-15253, 15256, 15259-15263, 15266-15270, 15273, 15276-15290, 15293, 15296, 15299-15304, 15306-15307, 15310, 15313, 15316-15320, 15322-15327, 15329, 15332-15339, 15342, 15345-15350, 15352-15355, 15358-15362, 15365, 15368, 15371, 15374-15379, 15381-15383, 15386, 15389-15397, 15399-15400, 15403-15406, 15408-15414, 15416-15417, 15420-15423, 15426-15429, 15432-15435, 15438-15443, 15446, 15449-15452, 15456-15458, 15461-15464, 15467-15469, 15471-15472, 15475-15478, 15482-15488, 15491, 15493-15494, 15497-15500, 15504, 15507, 15510, 15513-15516, deleted, 15520, 15523, 15526-15529, deleted, 15533, 15536, 15539-15542, 15546, 15549-15552, deleted, 15556, 15559, 15562-15565, 15569, 15572, 15575, 15578-15582, 15585, 15588-15591, 15594-15598, 15601-15608, 15611, 15614-15618, 15620-15622, 15624, 15627-15631, 15634-15637, 15639-15640, 15643, 15646-15663, 15666, 15669-15673, 15676-15681, 15684, 15717-15755, 15796-15873, 15893-15899, deleted, deleted, deleted, deleted, 16242-16248, 16265-16271, 16405-16433, 16459-16470, 16925-16934, 17001, 17018, 17030-17036, 17100-17109, 17160-17172, 17179-17185, 17355-17364, 17523, 17551-17567, 17581-17599, 17612-17624, 17638, 17644-17653, 17712-17790, 17978-17994, 18049, 18086, 18155, 18207, 18232, 18265, 18372-18387, 18393, 18398-18411, 18545-18557, deleted, deleted, 18640-18646, 18722-18728, 18750-18762, 19101-19110, 19157-19234, 19236-19241, 19300-19326, 19341-19369, 19493-19506, 19526-19548, 19553, 19611-19633, 19674-19725, 19768-19787, 19821-19833, 19900-19909, 20002, 20115, 20207-20221, 20408-20420, 20451-20464, 20471-20480, 20641-20672, 20685-20705, 20711, 20740-20749, 20781-20787, 20834, 20848 | Updates dependencies or scripts needed by the implementation. |

## AUTH-10a — Evidence record, commit de81305

**Date:** 2026-10-29. **Commit:** `de81305` — `docs(onboarding): record intro implementation evidence`. **Owner:** Anisha. Updates the intro ledger and its evidence; see [intro notes](../implementation/landing-intro.md).

| File at commit | Changed lines in that commit | Purpose |
|---|---|---|
| `docs/core_plan/02_auth_onboarding.md` | 260, 348 | Records scope, configuration, evidence, or remaining work for the implementation. |

## AUTH-01–07 and AUTH-13 — Authentication, commit 32165ea

**Date:** 2026-10-30. **Commit:** `32165ea` — `Completed sign in and sign up authentications set up`. **Owner:** Anisha. This broad increment includes email auth, session handling, callbacks, social-provider adapters, tests and setup records. It also records Plan 01 development configuration; the actual dashboard changes are external. [Auth scope and validation](../implementation/auth-screens.md), [QA](../qa/auth-foundation.md), [provider setup](../runbooks/social-auth-development.md). Native acceptance and API identity handoff are not implied.

| File at commit | Changed lines in that commit | Purpose |
|---|---|---|
| `README.md` | 1, 8, 13, 51, 124, 129-143 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/.env.example` | 5-6, 9-14 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/app.config.ts` | 4, 12, 15 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/assets/auth/dinosaur.png` | binary asset | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/glow.png` | binary asset | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/google.png` | binary asset | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/manifest.json` | 1-49 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/originals/dinosaur.svg` | 1-12 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/originals/glow.svg` | 1-9 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/originals/google.svg` | 1-13 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/originals/sparkle.svg` | 1-10 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/originals/star.svg` | 1-10 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/sparkle.png` | binary asset | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/auth/star.png` | binary asset | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/package.json` | 10, 12, 14, 20, 25, 33 | Updates dependencies or scripts needed by the implementation. |
| `apps/mobile/src/app/(auth)/_layout.tsx` | 4-5, 10 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/(auth)/confirm-email.tsx` | 1 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/(auth)/forgot-password.tsx` | 1 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/(auth)/reset-password.tsx` | 1 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/(auth)/sign-in.tsx` | 1, 4 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/(auth)/sign-up.tsx` | 1, 4 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/(auth)/social-sign-in.tsx` | 1 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/(tabs)/index.tsx` | 6 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/app/(tabs)/settings.tsx` | 1-2, deleted, 5-7, 10-11, 14-23, 27-30 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/app/_layout.tsx` | 12, 16-17, 22-28, 43, 52, 56-75 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/app/auth/callback.tsx` | 1 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/auth/link-error.tsx` | 1 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/app/index.tsx` | 1, 3, deleted, 6-14 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/auth/AppleButton.ios.tsx` | 1-11 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/AppleButton.tsx` | 1-13 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/AuthGate.tsx` | 1-13 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/AuthScreen.test.tsx` | 1-104 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/auth/AuthScreen.tsx` | 1-240 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/CallbackScreens.tsx` | 1-54 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/EmailFlows.test.tsx` | 1-71 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/auth/EmailFlows.tsx` | 1-114 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/auth-provider.tsx` | 1-26 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/entry-route.test.tsx` | 1-40 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/auth/link-controller.test.ts` | 1-164 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/auth/link-flow.test.ts` | 1-37 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/auth/link-flow.ts` | 1-53 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/session-controller.test.ts` | 1-171 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/auth/session-controller.ts` | 1-409 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/validation.test.ts` | 1-29 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/auth/validation.ts` | 1-13 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/intro/Introduction.tsx` | 90 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/infrastructure/auth/apple.ios.ts` | 1-22 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/apple.native.test.ts` | 1-35 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/infrastructure/auth/apple.ts` | 1-5 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/config.test.ts` | 1-14 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/infrastructure/auth/config.ts` | 1-21 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/crypto.native.test.ts` | 1-23 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/infrastructure/auth/crypto.ts` | 1-19 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/crypto.web.ts` | 1-4 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/errors.ts` | 1-33 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/oauth-browser.ts` | 1-5 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/oauth-browser.web.ts` | 1-6 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/sdk-signout.test.ts` | 1-39 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/infrastructure/auth/serialized-storage.test.ts` | 1-26 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/infrastructure/auth/serialized-storage.ts` | 1-22 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/social-config.ts` | 1-6 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/storage-web.test.ts` | 1-30 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/infrastructure/auth/storage.native.test.ts` | 1-21 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/infrastructure/auth/storage.ts` | 1-17 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/storage.web.ts` | 1-23 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/infrastructure/auth/supabase.ts` | 1-36 | Implements an authentication screen, session, callback, provider, or storage component. |
| `docs/AGENT_START_HERE.md` | 1-3, 9, 13-15 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/core_plan/02_auth_onboarding.md` | 5, 289-295, 346-352 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/implementation/auth-screens.md` | 1-96 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/implementation/hoosh-branding.md` | 1-33 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/qa/auth-foundation.md` | 1-183 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/runbooks/credentials-map.md` | 1-46 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/runbooks/social-auth-development.md` | 1-279 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/runbooks/supabase-development.md` | 1-66 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `package-lock.json` | 27, 29, 31, 37, 42, 50, 6031-6122, 9721-9731, 9762-9770, 10063-10071, 10153-10162, 10977-10985, 18373-18381, 20038 | Updates dependencies or scripts needed by the implementation. |

## AUTH-09–11 — Questions and permission bridge, commit bb4b540

**Date:** 2026-11-01. **Commit:** `bb4b540` — `User's onboarding questions, screen time validation not tested yet`. **Owner:** Anisha. Adds questionnaire UI, local draft, and platform permission bridge; it does not establish native enforcement. [Questionnaire validation](../implementation/onboarding-questions.md) and [native build evidence](../runbooks/native-development-builds.md). Device acceptance, demographic persistence and profile integration remain open.

| File at commit | Changed lines in that commit | Purpose |
|---|---|---|
| `.expo-home/native-modules-cache/5fb7988b0f60d2900b91069ef1e0f3dd53a35d64c727043d8fa99715551bbb00-body.bin` | 1 | Updates app integration, configuration, or navigation for this increment. |
| `.expo-home/native-modules-cache/5fb7988b0f60d2900b91069ef1e0f3dd53a35d64c727043d8fa99715551bbb00-info.json` | 1 | Updates app integration, configuration, or navigation for this increment. |
| `.gitignore` | 49-51 | Updates app integration, configuration, or navigation for this increment. |
| `README.md` | 65 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/app.config.ts` | 12 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/assets/onboarding/app-bird.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/app-camera.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/app-ghost.svg` | 1-10 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/app-play.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/arrow-left.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/check.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/gender-female.svg` | 1-14 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/gender-male.svg` | 1-13 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/gender-other.svg` | 1-15 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/gender-star.svg` | 1-10 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/hobby-arts.svg` | 1-10 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/hobby-book.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/hobby-cooking.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/hobby-gym.svg` | 1-10 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/hobby-music.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/hobby-walk.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/manifest.json` | 1-107 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/permission/dinosaur.svg` | 1-12 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/permission/glow.svg` | 1-9 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/permission/sparkle.svg` | 1-10 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/assets/onboarding/plus.svg` | 1-5 | Adds or updates design assets or their source manifest for the UI. |
| `apps/mobile/modules/hoosh-screen-time/android/build.gradle` | 1-10 | Adds native authorization integration or platform configuration. |
| `apps/mobile/modules/hoosh-screen-time/android/src/main/AndroidManifest.xml` | 1-3 | Adds native authorization integration or platform configuration. |
| `apps/mobile/modules/hoosh-screen-time/android/src/main/java/expo/modules/hooshscreentime/HooshScreenTimeModule.kt` | 1-48 | Adds native authorization integration or platform configuration. |
| `apps/mobile/modules/hoosh-screen-time/expo-module.config.json` | 1-16 | Adds native authorization integration or platform configuration. |
| `apps/mobile/modules/hoosh-screen-time/ios/HooshScreenTime.podspec` | 1-15 | Adds native authorization integration or platform configuration. |
| `apps/mobile/modules/hoosh-screen-time/ios/HooshScreenTimeModule.swift` | 1-28 | Adds native authorization integration or platform configuration. |
| `apps/mobile/modules/hoosh-screen-time/package.json` | 1-6 | Updates dependencies or scripts needed by the implementation. |
| `apps/mobile/package.json` | 33 | Updates dependencies or scripts needed by the implementation. |
| `apps/mobile/src/app/(onboarding)/welcome.tsx` | 1-3, 6-8 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/app/_layout.tsx` | deleted, 71 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/app/index.tsx` | 4-6, 10-12, 20 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/auth/EmailFlows.tsx` | 60, 65 | Implements an authentication screen, session, callback, provider, or storage component. |
| `apps/mobile/src/features/auth/entry-route.test.tsx` | 11 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/onboarding/OnboardingQuestions.test.tsx` | 1-155 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/onboarding/OnboardingQuestions.tsx` | 1-757 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/onboarding/draft.test.ts` | 1-46 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/features/onboarding/draft.ts` | 1-80 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/features/onboarding/figma-icons.ts` | 1-23 | Updates app integration, configuration, or navigation for this increment. |
| `apps/mobile/src/infrastructure/screen-time/authorization.native.test.ts` | 1-26 | Adds or updates automated coverage for this part. |
| `apps/mobile/src/infrastructure/screen-time/authorization.ts` | 1-24 | Adds native authorization integration or platform configuration. |
| `docs/AGENT_START_HERE.md` | 17-18, 136-137 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/implementation/onboarding-questions.md` | 1-45 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/implementation/remaining-work.md` | 1-10 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/implementation/screen-time-authorization.md` | 1-29 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `docs/runbooks/native-development-builds.md` | 1-142 | Records scope, configuration, evidence, or remaining work for the implementation. |
| `package-lock.json` | 50, 7832-7837, 8386-8435, 8730-8796, 16723-16728, 17449-17460, 18297, 18516-18529 | Updates dependencies or scripts needed by the implementation. |
| `package.json` | 21-24 | Updates dependencies or scripts needed by the implementation. |
| `scripts/check-native-toolchain.mjs` | 1-29 | Adds native development preparation or toolchain support. |
| `scripts/prepare-native-dev.mjs` | 1-50 | Adds native development preparation or toolchain support. |
| `scripts/start-android-emulator.mjs` | 1-19 | Adds native development preparation or toolchain support. |

## Current working-tree changes — pending commit

November 2 follow-up: a temporary signup age field was added and then removed at the owner's request. The separate onboarding age question remains; signup does not verify eligibility. Browser and native acceptance remain unverified.

November 2: the owner selected an 18–80 supported signup range and clarified that the third avatar is gender-neutral, not “Prefer not to answer.” The questionnaire requires an age and avatar choice and saves them in account-scoped local storage; the age selector is limited to 18–80. Signup still occurs before this questionnaire, so this does not enforce account eligibility. Existing completed users, server enforcement, Settings editing, cross-device sync, privacy notice and the use of these fields in plans remain open. `npm run typecheck --workspace @disconnect/mobile`, mobile lint, ten focused onboarding Jest tests and ten draft Vitest tests passed; physical-device and visual Figma acceptance remain unverified. This entry describes uncommitted work.

The plan preview UI and its focused test changes are uncommitted. Typecheck and nine focused onboarding tests passed when last run; the implemented preview has not been visually compared against Figma in a running app or validated on a physical device. It does not generate or apply a real plan. Documentation was reorganized to match the `main` structure and these notes/ledgers were updated. Recheck the full diff and verify integration with `main` before committing.

Historical inventories above are generated from Git hunk headers; deleted lines have no new-file line number, and binary assets have no line ranges. The existing detailed runbooks are the source for dated validation; do not infer unrecorded checks.


## AUTH-12 — Plan preview and congratulations UI, pending commit

**Date:** November 2, 2026. **Owner:** Anisha / requested implementation. **Branch:** `landing-page`, starting at `4cbe8c3`. **Commit:** Pending; owner retains commit/push control.

**Requirements:** FR-007/008, NFR-002/008; Figma `52:690`, `50:87`, `50:89`. This is a UI/local-preference slice; the full AUTH-12 policy, API and native gates remain open.

| File / current lines | Changes and purpose |
|---|---|
| `apps/mobile/src/features/onboarding/PlanScreens.tsx`: 1–124 | New shared preparation/review/congratulations presentation, original artwork, actual selected choices, hypothetical estimates, editing/skip/final controls, scrollable short-screen layout and inline retry. |
| `apps/mobile/src/features/onboarding/OnboardingQuestions.tsx`: 37–115, 178–192, 206–231, 325–326 | Compose the final screens, persist every final stage, single-flight completion, account/mount checks, inline errors and best-effort completed-draft cleanup. Removes superseded embedded PlanPreview styles/component. |
| `apps/mobile/src/app/(onboarding)/welcome.tsx`: 9 | Key questionnaire state to authenticated UUID for account replacement. |
| `apps/mobile/src/features/onboarding/draft.ts`: 3 | Permit eight internal states (loading and plan both display 6/7); existing version-1 drafts remain readable. |
| `apps/mobile/src/features/onboarding/draft.test.ts`: 35–53 | Reject step 8; cover resumed states 5–7. |
| `apps/mobile/src/features/onboarding/OnboardingQuestions.test.tsx`: 1–250 | Adapt existing completion cases; add resumed celebration, editing, storage retry and rapid-tap single-flight acceptance. |
| `apps/mobile/assets/onboarding/plan/`: manifest, original SVGs, crop SVGs, PNGs | Preserve frame sources and reproducible artifact hashes; export original hero artwork instead of inventing replacements. |
| `docs/implementation/onboarding-questions.md`: final-screen increment | Record exact behavior, browser evidence, checks and retained boundaries. |
| `docs/core_plan/02_auth_onboarding.md`: AUTH-12 ledger | Distinguish completed preview slice from outstanding real plan integration. |
| This notes file: this entry | Resume checkpoint and handoff. |

**Validation:** `npm run typecheck`, `npm run lint`, `npm test` (90 Vitest + 58 Jest), `npm run mobile:export` (26 routes), `services/api/.venv/bin/ruff check services/api`, `services/api/.venv/bin/pytest services/api/tests` (3), `git diff --check` passed. `npm run check` initially stopped at missing `uv`; equivalent API executables passed.

**Localhost evidence:** isolated QA copy with synthetic Auth outside repository; same source components and storage. 393×852 and 320×568 review, permission deferral, loading/advance, app/activity details, manual preference return, congratulations/reload, narrow scrolling, keyboard Enter and real Home destination. Fixed completion-copy overflow; final app warning/error log empty. Retry/single-flight faults tested automatically. Screenshots saved with the chat outputs. Production Auth gates were never replaced in the repository.

**Adaptations:** Local preparation explicitly says preview rather than claiming remote generation. Completion celebrates chosen preferences and states protection is inactive. Manual CTA returns to editable preferences; full manual protection-plan editing is outside these three requested frames and awaits the existing plan/native contracts.

**Next:** Owner review/commit; later native device acceptance, and separately approve/implement real suggested/manual plan authoring, server storage and native installation. Do not declare AUTH-12 production-complete from these preview checks.


## AUTH-12 — Five manual-plan states and local saving, pending commit

**Date:** November 2, 2026. **Owner:** Anisha / requested implementation. **Branch:** `landing-page`. **Commit:** Pending. Continues the prior uncommitted preview work; no commit or push performed.

**Scope:** FR-007/008/013, NFR-002/008. Figma `10556:120`, `10596:1767`, `10596:1861`, `10596:1968`, `10596:2062`. Full production AUTH-12 remains open.

| File / current lines | Change and reason |
|---|---|
| `apps/mobile/src/features/onboarding/ManualPlanScreen.tsx`: 1–123 | Four accessible accordion sections, day presets, hour fields, session chips, app preferences, local draft load/save/retry and single-flight accepted-plan persistence before congratulations. |
| `apps/mobile/src/features/onboarding/manual-plan.ts`: 1–58 | Versioned local-only model, schema/time parsing, validation, formatters and per-account storage keys. No shared native or server contract changes. |
| `apps/mobile/src/features/onboarding/TimeRangeSlider.tsx`: 1–39 | Stable native responder with gesture-only refs and accessibility adjustment; callbacks use current props without rebuilding native gesture state. Narrow compiler-lint exceptions document PanResponder's registration-only behavior. |
| `apps/mobile/src/features/onboarding/TimeRangeSlider.web.tsx`: 1–17; `TimeRangeSlider.types.ts`: 1 | Two native HTML range inputs for pointer/keyboard behavior with shared prop types. |
| `apps/mobile/src/features/onboarding/manual-plan-icons.ts`: 1–9; `assets/onboarding/manual-plan/` | Original Figma paths; five frame exports, icon crops and SHA-256 provenance manifest. |
| `apps/mobile/src/features/onboarding/draft.ts`: 1–91 | Add manual/suggested choice and optional completed manual plan; allow internal manual-editor step 8 while keeping version-1 compatibility. |
| `apps/mobile/src/features/onboarding/OnboardingQuestions.tsx`: 37–44, 87–90, 155–167, 183–197, 220–242, 334–339 | Open editor from suggestion CTA, restore setup choice, load saved manual plan on completion, preserve selected manual apps and keep account/lifecycle boundaries. |
| `apps/mobile/src/features/onboarding/PlanScreens.tsx`: 76–79 | Explain the manual CTA's actual days/hours/sessions/apps scope. |
| `apps/mobile/src/features/onboarding/ManualPlanScreen.test.tsx`: 1–68 | Edit/save all sections, validate/correct hours and apps, account draft recovery, read/write retry, rapid-save single-flight and unmount race. |
| `apps/mobile/src/features/onboarding/manual-plan.test.ts`: 1–35 | Time format boundaries, malformed stored values, preset summaries and storage isolation. |
| `apps/mobile/src/features/onboarding/draft.test.ts`: 35–51; `OnboardingQuestions.test.tsx`: 196–208, 252–266 | Expand step validation and verify manual save → congratulations → completed-answer integration; adapt previous editor-return expectation. |
| `docs/implementation/manual-plan.md`: full file | Exact behavior, original frames, authoring limits, persistence and verification evidence. |
| `docs/implementation/onboarding-questions.md`: manual CTA/follow-up; `docs/core_plan/02_auth_onboarding.md`: AUTH-12 ledger; this entry | Current scope/handoff and distinction from production enforcement. |

**Validation:** Workspace typecheck/lint; 116 Vitest + 66 Jest tests; production web export (26 routes); Ruff; 3 API pytest tests; whitespace checks passed. API checks used the existing `.venv` executables because `uv` is absent from PATH.

**Browser:** All five states compared with Figma at 393×852. 320×568 scrolling, wrapping and input bounds checked. Actual pointer and keyboard slider actions, invalid-time disabled Save, day presets, session/duration/app changes, draft reload, keyboard Save to congratulations, reload and final Home navigation passed. Final app warning/error log empty. Isolated synthetic-Auth QA copy remains outside release source. Failure/race coverage is automated; no browser storage fault injection or real Auth-provider retest claimed.

**Decisions:** Save locally before congratulating; distinguish draft vs accepted record; invalid text still prevents Save when its section is collapsed. Hours authoring is same-day only; this does not approve overnight/native session semantics. App preferences include Figma Facebook plus preexisting X when relevant. Original questionnaire app limits remain separate. No fake native installation or AI step.

**Remaining:** Physical devices, native selection/restriction installation, approved accounting/override/overlap policy, timezone/DST semantics, server revision/storage and later Settings editor integration. This completes the five requested UI states with local functionality only. Owner review/commit is next.


## Commit authorization — November 3, 2026

The owner requested committing the preview/completion and five manual-plan states together on `landing-page` with the exact message `implmented the set your own plan pages and it is tested`. This supersedes the earlier instruction to leave this work uncommitted. The implementation commit can be resolved by that message in Git history. Previous automated/browser evidence above applies; native/device acceptance remains pending. Push authentication must match the owner's requested GitHub account.

## Legacy Swift pivot — November 3, 2026, uncommitted

The owner pivoted to recovering the imported Swift app and approved shared selected-app usage accounting, iOS only. See `docs/implementation/legacy-swift-repair.md` for the initial repair, exact validation and unresolved device/backend/bypass/scheduling work. This work is separate from completed React Native manual-plan UI. First source changes touch Swift host monitoring/settings, monitor callbacks, host reminder scheduling and AI wire-date decoding; new files are `DailyUsageMonitoring.swift`, `NudgeResponseDecoder.swift` and `scripts/tests/nudge-response-decoder.swift`. Existing production identifiers and import provenance are retained. Simulator compilation passed; physical-device behavior and live cloud integration are not yet established. No commit/push or cloud deployment performed.

## Legacy Swift per-app daily limits — November 3, 2026, uncommitted

Owner approved separate daily limits rather than the first shared-budget implementation. `docs/implementation/legacy-per-app-limits.md` records affected files, logic, privacy boundaries and exact validation. SharedProtection policy/runtime sources now compile in the host, monitor and shield-action targets. The old aggregate monitor is retired after per-app registration; temporary access affects only its app. The new per-app card appears on Stats, Settings and onboarding so it cannot be confused with the older break-length card. Pure Swift policy checks, AI decoder checks, project parsing, signed device build and signed extension bundle checks passed. The app installed/launched and the owner confirmed the card. An earlier callback belonged to a deselected token; the current selected token's 5-minute threshold test is pending. Neither custom shield presentation nor full lifecycle behavior is passed yet. Native edits are intentional changes to the originally preserved import; no release or Git push performed.

## Legacy Swift auth-first flow — November 4, 2026, uncommitted

Owner requested sign-in before questionnaires/session setup, with Settings for later edits. Implemented NativeAppFlow and local AccountWorkspace restoration/isolation; retained existing pilot setup on first account association. Database sync requires matching workspace ownership and completed onboarding, and exposes separate sign-in / verified readback status. See `docs/implementation/legacy-swift-auth-first.md` for tests, installed build and pending phone sign-in/sync and timed shield acceptance. No push/release or cloud-schema change in this increment.

## Legacy Swift name/email study enrollment — supersedes password-first pilot

Owner prioritized research progression and requested no password/Google/email verification steps. Added private anonymous authenticated enrollment with name/email labels; same-phone Keychain resume; participant own-row storage and admin-only progression views. Owner enabled Anonymous sign-ins and applied additive study SQL manually while browser control timed out. Existing email-account confirmation remains enabled. Live enrollment/upsert/readback/refresh and private-view denial passed; migration/ownership/aggregation suites passed on isolated PostgreSQL. New signed build passed, but phone installation lost its wired connection and is awaiting reconnection. See `docs/implementation/legacy-swift-study-enrollment.md`; no Git push or release.
