// Fictional community content for scripts/seed-eva-network.ts (data only — no seeding logic lives here).
// Every account is <key>.demo@example.com. Nothing here is a real person, business or review.
type Tag = 'address' | 'watch_wait' | 'more_context' | 'been_there';
type Cat = 'Work' | 'Dating & Boundaries' | 'Housing & Moving' | 'Travel' | 'Services' | 'Everyday Life';
export type Member = { k: string; first: string; last: string; city: string | null; country: string | null; occupation?: string; bio?: string; languages?: string[]; known_for?: string[]; ask_me_about?: string[]; discoverability: 'direct' | 'extended' | 'community' };

export const members: Member[] = [
 // Eva's new Direct Circle members
 { k: 'sara', first: 'Sara', last: 'Hoxha', city: 'Tirana', country: 'Albania', occupation: 'Software engineer', bio: 'Backend engineer in Tirana. I moved home after four years in Milan and I am happy to talk about both directions of that decision.', languages: ['Albanian', 'Italian', 'English'], known_for: ['AI & Tech', 'Moving Abroad', 'Interviews'], ask_me_about: ['first tech job', 'Milan', 'remote work', 'salary negotiation'], discoverability: 'extended' },
 { k: 'marta', first: 'Marta', last: 'García', city: 'Madrid', country: 'Spain', occupation: 'Primary school teacher', bio: 'Teacher, aunt of five, terrible at saying no. Working on it.', languages: ['Spanish', 'English'], known_for: ['Parenting', 'Relationships & Boundaries'], ask_me_about: ['teaching in Spain'], discoverability: 'community' },
 { k: 'claire', first: 'Claire', last: 'Dubois', city: 'Paris', country: 'France', occupation: 'Journalist', bio: 'Freelance journalist covering housing and city policy. I ask a lot of questions for a living, so I am used to being told “it depends”.', languages: ['French', 'English', 'Italian'], known_for: ['Housing', 'Freelancing', 'Public Speaking'], ask_me_about: ['rental contracts', 'pitching editors', 'Paris'], discoverability: 'extended' },
 { k: 'ingrid', first: 'Ingrid', last: 'Nilsson', city: 'Stockholm', country: 'Sweden', occupation: 'Psychologist', bio: 'Clinical psychologist. Here as a friend, not as a therapist.', languages: ['Swedish', 'English', 'German'], known_for: ['Starting Over'], ask_me_about: ['Stockholm', 'changing careers'], discoverability: 'direct' },
 { k: 'aoife', first: 'Aoife', last: 'Byrne', city: 'Dublin', country: 'Ireland', occupation: 'Recent graduate, social work', bio: 'Just finished my social work degree. First proper job, first proper manager, lots of questions.', languages: ['English', 'Irish'], known_for: [], ask_me_about: ['interviews', 'graduate schemes'], discoverability: 'extended' },
 { k: 'priya', first: 'Priya', last: 'Sharma', city: 'Bengaluru', country: 'India', occupation: 'PhD candidate, computational biology', bio: 'Fourth-year PhD. Applied to programmes in three countries and learned the hard way what to ask supervisors before saying yes.', languages: ['Hindi', 'Kannada', 'English'], known_for: ['PhD Life', 'Scholarships', 'AI & Tech'], ask_me_about: ['PhD applications', 'studying abroad', 'Erasmus'], discoverability: 'community' },
 { k: 'lucia', first: 'Lucía', last: 'Fernández', city: 'Buenos Aires', country: 'Argentina', occupation: 'Hotel operations manager', bio: 'Twenty years in hotels, from night reception to running one. I notice when something at a front desk is off.', languages: ['Spanish', 'English', 'Portuguese'], known_for: ['Travel', 'Hospitality'], ask_me_about: ['travelling solo', 'working in hotels'], discoverability: 'extended' },
 // Extended Circle (second-degree to Eva)
 { k: 'anna', first: 'Anna', last: 'Weber', city: 'Berlin', country: 'Germany', occupation: 'Project manager', bio: 'Project manager at a mobility start-up. Spreadsheets, rock climbing, and very honest feedback.', languages: ['German', 'English'], known_for: ['Career Transitions', 'Interviews'], ask_me_about: ['salary negotiation', 'Berlin'], discoverability: 'extended' },
 { k: 'sophie', first: 'Sophie', last: 'Janssen', city: 'Amsterdam', country: 'Netherlands', occupation: 'Product designer', bio: 'Designer. I left an agency job last year and went freelance.', languages: ['Dutch', 'English'], known_for: ['Design', 'Freelancing'], ask_me_about: ['portfolio reviews', 'remote work'], discoverability: 'community' },
 { k: 'laura', first: 'Laura', last: 'Peeters', city: 'Brussels', country: 'Belgium', occupation: 'Policy consultant', languages: ['French', 'Dutch', 'English'], known_for: ['Career Transitions'], ask_me_about: ['Brussels', 'working with EU institutions'], discoverability: 'extended' },
 { k: 'freya', first: 'Freya', last: 'Larsen', city: 'Copenhagen', country: 'Denmark', occupation: 'Postdoctoral researcher', bio: 'Climate researcher. I moved to Copenhagen for a postdoc with two suitcases and a bike lock.', languages: ['Danish', 'English'], known_for: ['PhD Life', 'Moving Abroad'], ask_me_about: ['PhD applications', 'Copenhagen housing'], discoverability: 'extended' },
 { k: 'katharina', first: 'Katharina', last: 'Gruber', city: 'Vienna', country: 'Austria', occupation: 'Employment lawyer', bio: 'I explain how processes work. I can’t give you legal advice here.', languages: ['German', 'English'], known_for: ['Workplace rights'], ask_me_about: ['employment contracts'], discoverability: 'direct' },
 { k: 'emma', first: 'Emma', last: 'Clarke', city: 'London', country: 'United Kingdom', occupation: 'Freelance copywriter', bio: 'Words for hire. Twelve years freelancing, three of them very lean.', languages: ['English'], known_for: ['Freelancing', 'Entrepreneurship'], ask_me_about: ['invoicing', 'London rents'], discoverability: 'community' },
 { k: 'mei', first: 'Mei', last: 'Lin', city: 'Shanghai', country: 'China', occupation: 'Founder, tea import business', bio: 'Started a small tea business after leaving finance. Ask me about the boring parts.', languages: ['Mandarin', 'English'], known_for: ['Entrepreneurship', 'Starting Over'], ask_me_about: ['starting a business'], discoverability: 'extended' },
 { k: 'dilnoza', first: 'Dilnoza', last: 'Karimova', city: 'Tashkent', country: 'Uzbekistan', occupation: 'Master’s student, economics', bio: 'Applying for scholarships in Europe. Collecting every tip I can.', languages: ['Uzbek', 'Russian', 'English'], known_for: ['Scholarships'], ask_me_about: ['Erasmus', 'studying abroad'], discoverability: 'extended' },
 { k: 'olena', first: 'Olena', last: 'Kovalenko', city: 'Kyiv', country: 'Ukraine', occupation: 'Pharmacist', languages: ['Ukrainian', 'English', 'Polish'], known_for: ['Healthcare Navigation'], ask_me_about: [], discoverability: 'direct' },
 { k: 'francesca', first: 'Francesca', last: 'Moretti', city: 'Turin', country: 'Italy', occupation: 'PhD candidate, history', bio: 'Archives by day, Turin’s cheapest aperitivo by night. Moved here from Bari for my PhD.', languages: ['Italian', 'English'], known_for: ['PhD Life', 'Housing'], ask_me_about: ['Turin', 'PhD applications', 'moving alone'], discoverability: 'community' },
 { k: 'zeynep', first: 'Zeynep', last: 'Demir', city: 'Istanbul', country: 'Turkey', occupation: 'Machine learning engineer', bio: 'ML engineer, previously a maths teacher. Changing careers at 31 was the best scary thing I did.', languages: ['Turkish', 'English', 'German'], known_for: ['AI & Tech', 'Career Transitions'], ask_me_about: ['changing careers', 'first tech job'], discoverability: 'extended' },
 { k: 'rania', first: 'Rania', last: 'Khoury', city: 'Beirut', country: 'Lebanon', occupation: 'Architect', bio: 'Architect, mostly restoration work.', languages: ['Arabic', 'French', 'English'], known_for: ['Design'], ask_me_about: [], discoverability: 'direct' },
 // Community members outside Eva's circles
 { k: 'ngozi', first: 'Ngozi', last: 'Okafor', city: 'Lagos', country: 'Nigeria', occupation: 'Founder, logistics start-up', bio: 'I run a delivery company with 40 riders. Practical about money, contracts and hiring.', languages: ['English', 'Igbo', 'Yoruba'], known_for: ['Entrepreneurship', 'Public Speaking'], ask_me_about: ['raising money', 'hiring your first team'], discoverability: 'community' },
 { k: 'amani', first: 'Amani', last: 'Mushi', city: 'Dar es Salaam', country: 'Tanzania', occupation: 'Midwife', languages: ['Swahili', 'English'], known_for: ['Healthcare Navigation', 'Parenting'], ask_me_about: [], discoverability: 'community' },
 { k: 'camille', first: 'Camille', last: 'Tremblay', city: 'Montreal', country: 'Canada', occupation: 'PhD candidate, psychology', bio: 'Third-year PhD, research on sleep. Yes, I sleep badly too.', languages: ['French', 'English'], known_for: ['PhD Life'], ask_me_about: ['PhD applications', 'Montreal'], discoverability: 'community' },
 { k: 'jessica', first: 'Jessica', last: 'Moore', city: 'Chicago', country: 'United States', occupation: 'Restaurant shift manager', bio: 'Ten years in restaurants. Late shifts, regulars, and getting home safely.', languages: ['English', 'Spanish'], known_for: ['Hospitality'], ask_me_about: ['working nights'], discoverability: 'community' },
 { k: 'ximena', first: 'Ximena', last: 'López', city: 'Mexico City', country: 'Mexico', occupation: 'Muralist', bio: 'I paint walls. Commission contracts are my least favourite art form.', languages: ['Spanish', 'English'], known_for: ['Freelancing'], ask_me_about: ['pricing creative work'], discoverability: 'community' },
 { k: 'valeria', first: 'Valeria', last: 'Soto', city: 'Santiago', country: 'Chile', occupation: 'Marine biologist', languages: ['Spanish', 'English'], known_for: [], ask_me_about: ['fieldwork'], discoverability: 'extended' },
 { k: 'rosa', first: 'Rosa', last: 'Quispe', city: 'Lima', country: 'Peru', occupation: 'Secondary school teacher', bio: 'Teaching chemistry to teenagers, which is its own kind of fieldwork.', languages: ['Spanish', 'Quechua'], known_for: ['Education'], ask_me_about: [], discoverability: 'community' },
 { k: 'beatriz', first: 'Beatriz', last: 'Santos', city: 'São Paulo', country: 'Brazil', occupation: 'Management consultant', bio: 'Consultant. Lots of travel, lots of hotel breakfasts, strong opinions about both.', languages: ['Portuguese', 'English', 'Spanish'], known_for: ['Travel', 'Interviews'], ask_me_about: ['travelling solo', 'consulting careers'], discoverability: 'community' },
 { k: 'khadija', first: 'Khadija', last: 'Amrani', city: 'Casablanca', country: 'Morocco', occupation: 'Recent graduate, marketing', languages: ['Arabic', 'French', 'English'], known_for: [], ask_me_about: ['first job search'], discoverability: 'community' },
 { k: 'thandiwe', first: 'Thandiwe', last: 'Mokoena', city: 'Cape Town', country: 'South Africa', occupation: 'Clinical psychologist', bio: 'Psychologist and mother of a very loud toddler.', languages: ['English', 'isiZulu', 'Afrikaans'], known_for: ['Parenting', 'Relationships & Boundaries'], ask_me_about: ['returning to work after a baby'], discoverability: 'community' },
 { k: 'aigerim', first: 'Aigerim', last: 'Nurlanova', city: 'Almaty', country: 'Kazakhstan', discoverability: 'direct' },
];

// Eva's new Direct Circle (mutual accepted edges). Existing: giulia, amira, elena, chiara.
export const directOfEva = ['sara', 'marta', 'claire', 'ingrid', 'aoife', 'priya', 'lucia'];
// Mutual accepted pairs. Overlapping paths on purpose: anna (sara + marta), laura (claire + ingrid), francesca (giulia + lucia).
export const mutualPairs: [string, string][] = [
 ['sara', 'anna'], ['marta', 'anna'], ['claire', 'sophie'], ['claire', 'laura'], ['ingrid', 'laura'], ['ingrid', 'freya'], ['marta', 'katharina'],
 ['aoife', 'emma'], ['priya', 'mei'], ['sara', 'dilnoza'], ['elena', 'olena'], ['giulia', 'francesca'], ['lucia', 'francesca'], ['sara', 'zeynep'], ['lucia', 'rania'],
 ['sara', 'priya'], ['claire', 'ingrid'],
 // community clusters, more than two steps from Eva
 ['ngozi', 'amani'], ['camille', 'jessica'], ['ximena', 'valeria'], ['valeria', 'rosa'], ['beatriz', 'rosa'], ['khadija', 'thandiwe'], ['thandiwe', 'ngozi'], ['dilnoza', 'aigerim'],
];
// Trust Bridges already accepted between members who were in each other's Extended Circle.
export const acceptedBridges: [string, string][] = [['anna', 'katharina'], ['sophie', 'laura'], ['zeynep', 'dilnoza'], ['freya', 'laura']];
// Pending requests waiting for Eva (she answers herself), plus pending ones between demo members.
export const pendingToEva = ['anna', 'francesca', 'zeynep'];
export const pendingBetween: [string, string][] = [['ngozi', 'camille'], ['emma', 'sophie']];
export const declined: [string, string][] = [['ximena', 'beatriz'], ['jessica', 'amani']];
export const cancelled: [string, string][] = [['khadija', 'rosa']];

// Trust Notes: [author, title, topic, body, location]
export const notes: [string, string, string, string, string | null][] = [
 ['sara', 'Three things I wish I knew before renting in Milan', 'Housing & Moving', 'Agencies charge a fee of up to a month’s rent — ask before the viewing, not after.\nCheck whether heating is central or individual; it changes your winter bills a lot.\nGet the contract registered. If the landlord avoids it, walk away.', 'Milan'],
 ['sara', 'What helped me negotiate my first tech salary', 'Work', 'I asked for the range before giving a number, and I said my number once and then stayed quiet. The silence felt awful. It worked.', null],
 ['marta', 'Saying no to extra duties without guilt', 'Work', 'I now say “Let me check what I’d have to drop to do that.” It turns a yes/no into a conversation about priorities.', null],
 ['claire', 'How I avoid rental scams when moving abroad', 'Housing & Moving', 'Never pay before seeing the flat or meeting someone in person.\nReverse-search the listing photos.\nIf the landlord is “abroad” and can only send keys by post, it is a scam.', 'Paris'],
 ['claire', 'Pitching an editor for the first time', 'Work', 'Two short paragraphs: what the story is, why now, why you. Attach nothing. Follow up once after a week.', null],
 ['ingrid', 'Starting over in a new city at 40', 'Everyday Life', 'Pick one weekly thing — a class, a choir, a running group — and go even when you don’t want to. Friendship is mostly repetition.', 'Stockholm'],
 ['aoife', 'What I learned from my first ten job interviews', 'Work', 'Have one story about a mistake ready. Ask what a normal week looks like. Write down their answers straight after, because they blur together.', 'Dublin'],
 ['priya', 'Things nobody told me about starting a PhD', 'Study', 'Your supervisor matters more than the project.\nAsk current students, privately, how often they actually meet.\nThe first year feels slow. That’s normal, not failure.', null],
 ['priya', 'Questions to ask before accepting a PhD offer', 'Study', 'How is funding guaranteed after year three? Who reads drafts and how fast? What happened to the last three students? If no one will answer the last one, notice that.', null],
 ['priya', 'Scholarship applications: what reviewers told me', 'Study', 'Be specific about why this programme, not just why abroad. One honest paragraph about a setback reads better than a list of prizes.', null],
 ['lucia', 'Things I learned travelling alone', 'Travel', 'Arrive in daylight when you can. Tell reception you’re expecting a friend later, even if you aren’t. Keep one card separate from your wallet.', null],
 ['lucia', 'Checking a hotel before you book', 'Travel', 'Read the one- and two-star reviews and look for patterns about safety or doors, not breakfast.', 'Buenos Aires'],
 ['anna', 'My one-page career change plan', 'Work', 'What I want to keep, what I want to leave behind, three people to talk to, and a date to decide by. That was enough to stop going in circles.', 'Berlin'],
 ['sophie', 'Before you go freelance', 'Money', 'Save three months of expenses, line up one anchor client, and decide your minimum day rate before anyone asks you for it.', 'Amsterdam'],
 ['freya', 'Finding a room in Copenhagen as a researcher', 'Housing & Moving', 'Ask the university housing office first — they often have short sublets. Expect to move twice in the first year.', 'Copenhagen'],
 ['freya', 'Postdoc offers: read the contract twice', 'Study', 'Check the end date, the teaching load and whether the salary is fixed in the contract or “subject to funding”.', null],
 ['katharina', 'How an employment dispute usually unfolds', 'Work', 'Generally: you raise it in writing, there’s an internal step, then mediation or a works council if one exists. Keep copies of everything. This is a description of a process, not advice for your case.', 'Vienna'],
 ['emma', 'Invoices that actually get paid', 'Money', 'Number them, put the due date in bold, and include your bank details on every one. Late fees in the terms help even if you never charge them.', 'London'],
 ['mei', 'The boring parts of starting a small business', 'Money', 'Bookkeeping from day one, a separate bank account, and a lawyer for the supplier contract. Everything else you can learn on the way.', 'Shanghai'],
 ['dilnoza', 'My Erasmus application checklist', 'Study', 'Transcript translated and stamped, two references asked a month early, language certificate, and a motivation letter read by someone outside your faculty.', 'Tashkent'],
 ['francesca', 'A short guide to renting in Turin as a student', 'Housing & Moving', 'San Salvario and Vanchiglia are lively and pricier; Barriera di Milano is cheaper. Ask if the condominium fees are included. Many landlords prefer 4+4 contracts — student contracts exist too.', 'Turin'],
 ['zeynep', 'Changing careers into AI without a CS degree', 'Work', 'I did one structured course, built two small projects with real data, and asked three engineers to review my code. Applying felt less like pretending after that.', 'Istanbul'],
 ['ngozi', 'Before you sign with an investor', 'Money', 'Talk to two founders they funded who didn’t succeed. How they treated them in hard times tells you everything.', 'Lagos'],
 ['camille', 'Surviving the third year of a PhD', 'Study', 'Write something every week, even badly. Have one friend outside academia. Book holidays in advance or they never happen.', 'Montreal'],
 ['jessica', 'Getting home after a late shift', 'Everyday Life', 'I leave with a colleague when I can, keep my keys in my hand, and text one person when I’m home. Small routine, less worry.', 'Chicago'],
 ['beatriz', 'A small checklist for travelling for work alone', 'Travel', 'Share your itinerary with one person. Ask for a room not on the ground floor. Keep the hotel’s address written down in the local language.', null],
 ['thandiwe', 'Going back to work after a baby', 'Work', 'Ask for a phased return in writing, and decide in advance what you’ll say when people ask how you’re “really” doing.', 'Cape Town'],
 ['amani', 'A small checklist for choosing a doctor in a new city', 'Health & Care', 'Ask women at work who they actually see. Call the clinic: how they answer the phone is a good sign. Book something small first.', 'Dar es Salaam'],
];

// Trusted Picks: [owner, category, title, note, location] — fictional places, never real reviews.
export const picks: [string, string, string, string, string | null][] = [
 ['sara', 'Health & Care', 'A dentist who explains the bill before starting', 'Gave me a written estimate and didn’t push extra treatment.', 'Tirana · Blloku'],
 ['sara', 'Everyday Life', 'A coworking space with a women’s tech meetup', 'Quiet desks, decent coffee, and a monthly meetup that’s actually friendly.', 'Tirana'],
 ['marta', 'Services', 'A mechanic who shows you the old part', 'He hands back what he replaced and explains it without talking down.', 'Madrid · Usera'],
 ['marta', 'Everyday Life', 'A maths tutor who is patient with nervous kids', 'My nephew stopped dreading homework after a month.', 'Madrid'],
 ['claire', 'Housing & Moving', 'A free tenants’ advice line', 'They read my lease clause by clause and told me what was standard.', 'Paris'],
 ['claire', 'Food & Drink', 'A café where people write alone all day', 'Big tables, sockets everywhere, and nobody minds one coffee for three hours.', 'Paris · 11e'],
 ['ingrid', 'Everyday Life', 'A beginners’ choir that welcomes newcomers', 'No audition, people go for a drink after. How I made my first friends here.', 'Stockholm · Södermalm'],
 ['aoife', 'Services', 'A hairdresser who listens to “just a trim”', 'Exactly what I asked for, no lecture about my split ends.', 'Dublin · Rathmines'],
 ['priya', 'Everyday Life', 'An online community for women in computational science', 'Kind people, good job board, and nobody minds beginner questions.', null],
 ['priya', 'Health & Care', 'A university counselling service with short waits', 'Booked within a week. They helped me plan around a bad semester.', 'Bengaluru'],
 ['lucia', 'Travel', 'A women-run hostel with keycard floors', 'Staff at the desk all night and a separate women’s floor.', 'Buenos Aires · Palermo'],
 ['lucia', 'Food & Drink', 'A bakery that opens at six', 'Perfect for early flights. The medialunas are worth the queue.', 'Buenos Aires'],
 ['anna', 'Everyday Life', 'A climbing gym with a women’s beginners evening', 'Patient instructors and no one shows off.', 'Berlin · Kreuzberg'],
 ['sophie', 'Everyday Life', 'A freelancers’ peer group that meets monthly', 'We review each other’s rates. Honest, useful, a little bit brutal.', 'Amsterdam'],
 ['freya', 'Housing & Moving', 'The university housing office’s sublet list', 'Not glamorous, but every room I found came from it.', 'Copenhagen'],
 ['emma', 'Services', 'An accountant who works with freelancers', 'Fixed yearly fee, answers emails, never made me feel stupid.', 'London'],
 ['francesca', 'Food & Drink', 'An aperitivo bar that’s fine to go to alone', 'Friendly staff and a long counter. I read there on Fridays.', 'Turin · Vanchiglia'],
 ['francesca', 'Health & Care', 'A gynaecologist who takes time with first visits', 'Explained everything and asked before each step.', 'Turin'],
 ['zeynep', 'Everyday Life', 'A study group for career changers learning to code', 'Saturday mornings, mixed levels, very low ego.', 'Istanbul · Kadıköy'],
 ['dilnoza', 'Services', 'A translation office that certifies documents quickly', 'Two days for my transcript, clear price list.', 'Tashkent'],
 ['beatriz', 'Travel', 'Airport taxis booked through the official desk', 'Fixed fare, receipt, and the car number written on it.', 'São Paulo · Guarulhos'],
 ['jessica', 'Services', 'A self-defence class run by a women’s centre', 'Calm, practical, not scary. Mostly about voice and distance.', 'Chicago'],
 ['camille', 'Health & Care', 'A sliding-scale counselling clinic for students', 'Fees adjust to income. Waiting list was three weeks.', 'Montreal'],
];

// Ripples: author, category, reach, private instinct (+ optional private note), body, replies, Echo target, optional Echo Room and outcome.
// Echo Room entries: 0 = the author (Original Poster), n = the n-th echoer.
export type SeedRipple = { by: string; cat: Cat; scope: 'circle' | 'extended' | 'community'; instinct: 'feels_okay' | 'unsure' | 'feels_off'; note?: string; body: string; replies: [Tag, string][]; echoes: number; room?: [number, string][]; outcome?: [string, string, string | null, boolean] };
export const ripples: SeedRipple[] = [
 // ── Maya (demo author): her "Started by me" workspace
 { by: 'maya', cat: 'Work', scope: 'community', instinct: 'feels_off', note: 'I like the job otherwise.', body: 'My manager keeps messaging me after 9pm and seems annoyed if I don’t answer until the morning. Is this something you’d address directly?', echoes: 14, replies: [
  ['address', 'Yes. I’d say it once, kindly: “I see messages in the morning — if something is urgent, please call.”'],
  ['been_there', 'Had this exact manager. When I stopped replying at night, nothing bad happened. She just adjusted.'],
  ['watch_wait', 'I’d notice for a week whether anything sent at night actually needs a night answer. That gives you a calm example.'],
  ['more_context', 'Is there anything in your contract about availability? It changes how firm you can be.'],
  ['address', 'Turn off notifications after 8 and mention it in your next 1:1 as a working habit, not a complaint.'],
  ['been_there', 'Mine was doing it because she was overwhelmed, not because she expected answers. Asking her directly cleared it up.'],
  ['address', 'I’d ask what she expects. Sometimes people send late because that’s when they have time, and assume you’ll read it later.'],
  ['watch_wait', 'Honestly, I’d answer in the morning without commenting on it and see if the annoyance is real or imagined.'],
  ['more_context', 'Does she do this to everyone, or just you? That would change what I’d say.'],
  ['been_there', 'I said “I’m offline after 7 but I’ll pick this up first thing.” Felt scary, was fine.'],
  ['address', 'A short team norm helps — “non-urgent messages answered next working day.” Then it’s not personal.'],
  ['watch_wait', 'If she’s annoyed but never says it, maybe wait until she actually raises it.'],
  ['been_there', 'Same in hospitality. The managers who messaged late were also the ones who burned out first.'],
  ['address', 'Put it in writing after you talk about it, just a two-line summary email.'],
  ['more_context', 'How long have you been in the job? In the first months I’d be a bit softer about it.'],
  ['address', 'I’d raise it now while it’s still small. It’s much harder after a year.'],
 ], room: [[0, 'Thank you all for echoing this. I didn’t expect so many of you.'], [1, 'Mine started at 10pm. Turning off notifications was the first step for me.'], [2, 'I still feel guilty not answering, even though I know I don’t have to.'], [3, 'What helped me was saying it out loud in a 1:1 once. Not a fight, just a sentence.'], [0, 'I’ll try that sentence this week.'], [4, 'Good luck. Come back and tell us?']], outcome: ['talked', 'I raised it in our 1:1: non-urgent messages get a reply next morning.', 'She said she didn’t realise it felt like pressure. It’s been better, though not perfect.', true] },
 { by: 'maya', cat: 'Housing & Moving', scope: 'community', instinct: 'unsure', body: 'I’m moving to Milan alone next month for a new job. What do you wish you’d known before your first move abroad?', echoes: 7, replies: [
  ['been_there', 'Register your residence early — so many things depend on it, even a gym membership.'],
  ['been_there', 'I wish I’d booked a short sublet first instead of signing a year-long contract from abroad.'],
  ['address', 'Check whether the agency fee is negotiable. In Milan it often is.'],
  ['more_context', 'Which part of Milan will you work in? Commute matters more than the neighbourhood’s reputation.'],
  ['been_there', 'The loneliness hits around month two, not week one. Plan something for then.'],
  ['address', 'Get the codice fiscale as soon as you arrive. Everything asks for it.'],
  ['watch_wait', 'I’d give yourself three months before judging the city. The first weeks are pure admin.'],
  ['been_there', 'Moving alone was the best thing I did, and also the most tiring. Both are true.'],
  ['address', 'Join one group immediately — running, language exchange, anything.'],
 ], outcome: ['moved_forward', 'I moved, found a sublet near Porta Romana and signed a proper contract after a month.', null, true] },
 { by: 'maya', cat: 'Work', scope: 'extended', instinct: 'feels_okay', body: 'I’ve been offered a promotion that means managing two former peers. One of them applied for the same role. How would you start that first week?', echoes: 2, replies: [
  ['address', 'I’d have a private coffee with her in the first days and say plainly that you value her.'],
  ['watch_wait', 'Don’t change much in week one. Listen first.'],
  ['more_context', 'Do you know why she didn’t get it? That shapes the conversation.'],
 ] },
 { by: 'maya', cat: 'Dating & Boundaries', scope: 'circle', instinct: 'feels_off', note: 'Second time he asked.', body: 'I met someone twice and he keeps asking exactly where I live, even though I avoid answering. Am I being too cautious?', echoes: 1, replies: [
  ['address', 'No. You can say “I’ll share that when I know you better” and see how he takes it.'],
  ['been_there', 'Someone did this to me. How he reacted to a calm no told me everything.'],
 ] },
 { by: 'maya', cat: 'Everyday Life', scope: 'extended', instinct: 'unsure', body: 'A friend borrowed a fair amount of money in spring and hasn’t mentioned it since. I don’t want to lose the friendship. How do I bring it up?', echoes: 0, replies: [] },
 { by: 'maya', cat: 'Services', scope: 'community', instinct: 'feels_off', body: 'A dentist quoted me for six fillings at my first visit. My old dentist never mentioned any. Would you get a second opinion?', echoes: 4, replies: [
  ['address', 'Yes, always for something that big. Ask for the X-rays so the second dentist can compare.'],
  ['been_there', 'Second dentist said I needed one, not five. I’m glad I checked.'],
  ['more_context', 'When was your last check-up with the old dentist? A few years can change a lot.'],
  ['address', 'Ask the first dentist to show you each one on the X-ray. A good one won’t mind.'],
  ['watch_wait', 'Unless anything hurts, there’s no rush to decide this week.'],
 ], outcome: ['other', 'A second dentist found two small fillings, not six.', 'I didn’t go back to the first clinic.', true] },
 { by: 'maya', cat: 'Travel', scope: 'community', instinct: 'feels_okay', body: 'First solo trip for a work conference in Vienna. Any small habits that made travelling alone feel easier for you?', echoes: 3, replies: [
  ['been_there', 'I eat at the bar instead of a table. Feels less alone and staff chat more.'],
  ['address', 'Save your hotel address offline and in German.'],
  ['been_there', 'I always plan one tiny treat per day. A museum, a cake, a walk.'],
  ['address', 'Tell one colleague your plans for the evening. Not because anything will happen, just habit.'],
 ] },
 { by: 'maya', cat: 'Work', scope: 'community', instinct: 'unsure', body: 'I want to ask for a salary review but our company just announced a hiring freeze. Is it a bad moment, or is there no good moment?', echoes: 9, replies: [
  ['address', 'Ask anyway, but ask for a review date rather than a number. Freezes end.'],
  ['watch_wait', 'I’d wait a month and collect your wins in writing first.'],
  ['been_there', 'I asked during a freeze and got a title change and a date. Better than nothing.'],
  ['more_context', 'Is the freeze on hiring only, or on raises too? They’re often different.'],
  ['address', 'Frame it as wanting to understand your path, not demanding money now.'],
  ['been_there', 'There’s never a good moment. I waited two years for one.'],
  ['address', 'Know your market rate before the conversation. It changes your tone.'],
  ['watch_wait', 'Maybe raise it at your next review cycle if it’s soon.'],
 ], outcome: ['figuring_out', 'I asked for a review date; she said “after the summer”.', 'Not sure if that’s real yet. I’m keeping a list of what I’ve delivered.', false] },

 // ── Eva's Direct Circle members
 { by: 'sara', cat: 'Work', scope: 'extended', instinct: 'unsure', body: 'I got a job offer from a company that does AI for hiring. The pay is great, but I’m uneasy about the product. How do you weigh that?', echoes: 5, replies: [
  ['more_context', 'What exactly makes you uneasy — the product, or how they talk about it?'],
  ['address', 'Ask them in the interview how they test for bias. Their answer will tell you a lot.'],
  ['been_there', 'I took a job I felt uneasy about. The money didn’t make up for it after a year.'],
  ['watch_wait', 'You don’t have to decide today. Ask for a week.'],
  ['address', 'Talk to someone who left the company, if you can find one.'],
 ], outcome: ['left', 'I declined and stayed in my current role.', 'Their bias-testing answer was vague. I sleep better.', true] },
 { by: 'sara', cat: 'Housing & Moving', scope: 'circle', instinct: 'feels_okay', body: 'Thinking of moving back from Tirana to Milan for a year. Is that a step back or just a step?', echoes: 0, replies: [
  ['more_context', 'What would you be going back for? That’s the real answer.'],
 ] },
 { by: 'marta', cat: 'Everyday Life', scope: 'community', instinct: 'unsure', body: 'My sister keeps leaving her kids with me at the last minute and I always say yes. I love them, but I’m exhausted. How do I set a limit without a family fight?', echoes: 11, replies: [
  ['address', 'Offer specific days instead of “whenever”. It feels generous and still sets a limit.'],
  ['been_there', 'Same with my brother. Saying “not today, but Thursday works” changed it.'],
  ['more_context', 'Does she know how tired you are? Sometimes people genuinely don’t.'],
  ['address', 'Tell her when you’re both calm, not on the doorstep.'],
  ['watch_wait', 'Maybe say no once and see what happens. It might be less dramatic than you expect.'],
  ['been_there', 'There was a fight. Then it got better. I don’t regret it.'],
  ['address', 'Kind and short: “I love having them, I need a day’s notice.”'],
  ['more_context', 'Is she struggling with something herself right now?'],
  ['address', 'You can love them and still say no. Both at once.'],
  ['been_there', 'My mother did this for years and resented it. I wish she’d said something.'],
 ], room: [[0, 'I didn’t think this would resonate with so many people.'], [1, 'It’s my mother-in-law for me. Same exhaustion.'], [2, 'The “Thursday works” idea is what I needed.'], [0, 'I’m going to try offering two fixed days.']], outcome: ['boundary', 'I offered two fixed afternoons a week instead of last-minute calls.', 'She was hurt for a few days. Now she plans ahead and I actually enjoy the kids again.', true] },
 { by: 'marta', cat: 'Work', scope: 'circle', instinct: 'feels_okay', body: 'Head teacher asked me to run the school trip again this year. I did it the last three. Is it okay to suggest someone else?', echoes: 0, replies: [] },
 { by: 'claire', cat: 'Housing & Moving', scope: 'community', instinct: 'feels_off', body: 'A landlord in Paris asked for three months’ rent in cash “as a guarantee” before signing anything. Is this as unusual as it feels?', echoes: 8, replies: [
  ['address', 'Very unusual. I wouldn’t pay anything before a signed lease.'],
  ['been_there', 'Same request in Rome. It was a scam — the flat wasn’t his.'],
  ['address', 'Ask for the deposit to go by bank transfer against a receipt. If he refuses, walk away.'],
  ['more_context', 'Did you see the flat in person with him?'],
  ['address', 'Check who owns the property if you can. It’s often possible.'],
  ['been_there', 'I lost a deposit this way once. Please don’t pay in cash.'],
 ], outcome: ['left', 'I walked away and found a flat through a registered agency.', null, true] },
 { by: 'claire', cat: 'Work', scope: 'extended', instinct: 'unsure', body: 'An editor I like wants me to write a piece for free “for exposure”. I’ve been freelancing for eight years. How would you reply?', echoes: 3, replies: [
  ['address', 'Thank her and send your rate. If she can’t pay, she can say so.'],
  ['been_there', 'Exposure never paid my rent. I say no politely and keep the door open.'],
  ['watch_wait', 'Is there a paid piece you could pitch instead?'],
  ['address', 'Eight years in — you’re allowed to just say no.'],
 ] },
 { by: 'ingrid', cat: 'Everyday Life', scope: 'circle', instinct: 'feels_okay', body: 'A neighbour I barely know invited me to her book club. I’m shy and almost said no. Would you go?', echoes: 0, replies: [
  ['address', 'Go once. You can always leave early.'],
  ['been_there', 'That’s how I met my best friend here.'],
 ], outcome: ['moved_forward', 'I went. They’re reading something long and I’m behind, but I’m going back.', null, true] },
 { by: 'aoife', cat: 'Work', scope: 'community', instinct: 'feels_off', note: 'First job, don’t want to blow it.', body: 'Three weeks into my first job. My manager comments on what I eat at lunch, like “that’s a lot of carbs”. Small thing, but it’s every day. Do I say something?', echoes: 12, replies: [
  ['address', 'You can say, lightly, “I’d rather not talk about my food.” Then change the subject.'],
  ['been_there', 'I had this. I started eating elsewhere and it stopped being an issue, but I wish I’d said something.'],
  ['watch_wait', 'Three weeks is early. Maybe observe whether he does it to others.'],
  ['address', 'If it continues after one clear sentence, it’s something for HR.'],
  ['more_context', 'Is there someone senior you trust there?'],
  ['been_there', 'My manager did this too. Nobody else noticed it, which made it feel worse.'],
  ['address', 'Short and boring is the best tone. No explanation needed.'],
  ['watch_wait', 'Write down dates and what was said, just for yourself.'],
  ['address', 'It’s not small if it’s daily.'],
  ['been_there', 'I said it once, he apologised, and that was it. Sometimes it really is that easy.'],
  ['more_context', 'Does he comment on other people’s bodies or habits too?'],
 ], room: [[0, 'I said the sentence today. My hands were shaking.'], [1, 'Proud of you. Mine was about my clothes, and saying it once was enough.'], [2, 'I never said anything and still think about it. Glad you did.'], [3, 'How did he react?'], [0, 'Awkward pause, then “fair enough”. We’ll see.']], outcome: ['boundary', 'I told him I’d rather not talk about my food. He stopped.', 'It was awkward for a day. Worth it.', true] },
 { by: 'aoife', cat: 'Work', scope: 'circle', instinct: 'unsure', body: 'Got two graduate offers: one in Dublin near family, one in London with more money. I keep changing my mind every hour.', echoes: 1, replies: [
  ['more_context', 'What would you miss most in each case?'],
  ['watch_wait', 'Sleep on it two nights in a row pretending you chose each one.'],
 ], outcome: ['figuring_out', 'Still deciding. I’ve asked London for one more week.', null, false] },
 { by: 'priya', cat: 'Work', scope: 'community', instinct: 'feels_off', note: 'I really wanted this.', body: 'I’ve been offered a PhD position I really wanted, but the supervisor’s communication already feels strange — very slow, then suddenly urgent. Am I overthinking it?', echoes: 10, replies: [
  ['more_context', 'Have you talked to any of his current PhD students privately?'],
  ['address', 'Ask him directly how often you’d meet and how fast drafts get feedback.'],
  ['been_there', 'My supervisor was like this from the first email. It never changed.'],
  ['watch_wait', 'Some professors are just chaotic with email and fine in person. Can you meet him?'],
  ['been_there', 'Mine was slow then urgent too, but genuinely kind. It can go either way.'],
  ['address', 'Ask for a co-supervisor. It protects you if things get difficult.'],
  ['more_context', 'Is the funding tied to him personally or to the department?'],
  ['address', 'Trust the feeling enough to ask questions. Not enough to walk away yet.'],
  ['been_there', 'I ignored a similar feeling about a PhD in Turin. I left after a year.'],
 ], room: [[0, 'Didn’t expect this many echoes. Thank you.'], [1, 'Talking to his students was the most useful thing I did in my own search.'], [2, 'I stayed with a chaotic supervisor. Having a second one saved me.'], [0, 'Asked for a call with two of them next week.']], outcome: ['talked', 'I spoke to two of his students and asked for a co-supervisor.', 'They said he’s disorganised but fair. I accepted, with a co-supervisor in writing.', true] },
 { by: 'priya', cat: 'Travel', scope: 'extended', instinct: 'feels_okay', body: 'Going to my first conference abroad, sharing an Airbnb with two students I’ve never met. Anything you’d check beforehand?', echoes: 0, replies: [
  ['address', 'Make sure your name is on the booking too.'],
  ['address', 'Agree on splitting costs before you arrive.'],
  ['been_there', 'Did this in Copenhagen. Lovely people. Earplugs saved me.'],
 ] },
 { by: 'lucia', cat: 'Travel', scope: 'community', instinct: 'feels_off', body: 'A man at a hostel bar overheard my plans and offered to “show me around” tomorrow. I said maybe. How do I say no without it being awkward at breakfast?', echoes: 6, replies: [
  ['address', '“I’ve made other plans, have a good day.” Then nothing else.'],
  ['been_there', 'I told reception, just so someone knew. They kept an eye out.'],
  ['watch_wait', 'You don’t owe him a follow-up. Maybe he won’t ask.'],
  ['address', 'Say it now rather than at breakfast. Shorter is easier.'],
 ], outcome: ['boundary', 'I told him I had other plans. He shrugged.', null, true] },
 { by: 'lucia', cat: 'Work', scope: 'circle', instinct: 'unsure', body: 'Head office wants me to move to a hotel in another city for six months. I said yes before thinking. Can I take it back?', echoes: 0, replies: [] },

 // ── Eva's Extended Circle members
 { by: 'anna', cat: 'Work', scope: 'community', instinct: 'unsure', body: 'I’m 34 and thinking about leaving project management for UX research. Everyone online says it’s easy to switch. It doesn’t feel easy. Any honest experiences?', echoes: 6, replies: [
  ['been_there', 'Switched at 36. It took a year and a pay cut, but I’d do it again.'],
  ['more_context', 'Can you do a research project inside your current company first?'],
  ['address', 'Talk to three UX researchers before taking a course. They’ll tell you what courses won’t.'],
  ['watch_wait', 'Keep your job while you build a small portfolio.'],
  ['been_there', 'It’s not easy. People who say it is usually had a lucky first job.'],
  ['address', 'Your PM experience counts. Frame it as research in disguise.'],
  ['been_there', 'Career change at 31 here. It felt like starting over and also like using everything I knew.'],
 ], outcome: ['moved_forward', 'I’m doing a research project inside my team and talking to two researchers monthly.', null, true] },
 { by: 'anna', cat: 'Housing & Moving', scope: 'extended', instinct: 'feels_off', body: 'My flatmate in Berlin keeps having her boyfriend stay over five nights a week. He doesn’t pay anything. How would you bring it up?', echoes: 2, replies: [
  ['address', 'Suggest he contributes to bills. Keep it about money, not about him.'],
  ['been_there', 'We agreed on a number of nights. It saved the friendship.'],
 ] },
 { by: 'sophie', cat: 'Work', scope: 'community', instinct: 'unsure', body: 'A client wants “a few quick logo options” before agreeing on a price. I’ve been burned before. How do you handle requests for free samples?', echoes: 4, replies: [
  ['address', 'Send a short proposal first with a paid first round. No sketches before.'],
  ['been_there', 'I did free options once. Never got paid, saw one of them used.'],
  ['address', 'Show your portfolio instead. That’s what it’s for.'],
  ['more_context', 'Is it a big client or a small one? I’d handle them differently.'],
  ['address', 'Offer a short paid discovery session.'],
 ] },
 { by: 'freya', cat: 'Housing & Moving', scope: 'community', instinct: 'unsure', body: 'I need to find a room in Copenhagen within a month for my postdoc. Everything is gone within hours. Is it normal to feel this panicked?', echoes: 5, replies: [
  ['been_there', 'Yes. I lived in three sublets in my first year.'],
  ['address', 'Ask the university housing office and the department admin. Admins always know someone.'],
  ['watch_wait', 'Take a short sublet and search from inside the city.'],
 ], outcome: ['observed', 'Found a two-month sublet and I’m searching from here.', null, true] },
 { by: 'francesca', cat: 'Housing & Moving', scope: 'community', instinct: 'feels_okay', body: 'Moving to Turin for my PhD in September. Which neighbourhoods would you look at on a stipend, and what should I avoid in rental contracts?', echoes: 3, replies: [
  ['address', 'Look at Vanchiglia and Borgo Po. Check if condo fees are included.'],
  ['been_there', 'I live in San Salvario. Loud on weekends, great community.'],
  ['address', 'Ask for a student contract; they’re shorter and easier to leave.'],
  ['more_context', 'Where is your department? Turin is easy by tram, but not everywhere.'],
  ['been_there', 'Avoid paying anything before the contract is registered.'],
  ['address', 'Use the university housing service first. It saved me weeks.'],
 ], outcome: ['moved_forward', 'Signed a student contract in Vanchiglia.', 'Condo fees included, registered contract, flatmates from my department.', true] },
 { by: 'zeynep', cat: 'Work', scope: 'community', instinct: 'unsure', body: 'In tech interviews they ask for my current salary. I was a teacher, so it’s low. Do I have to tell them?', echoes: 8, replies: [
  ['address', 'Give your expected range instead. You don’t have to share your current salary.'],
  ['been_there', 'I said “I’d rather focus on the value of this role.” It worked.'],
  ['more_context', 'Depends a bit on the country. In some places it’s not allowed to ask.'],
  ['address', 'Look up the salary range first so you’re not anchored to the old one.'],
  ['been_there', 'I told the truth once and the offer was low. Never again.'],
  ['address', 'Change careers, change the number.'],
  ['watch_wait', 'If they insist, notice that. It tells you about their culture.'],
  ['been_there', 'Same here. Negotiating my first salary felt like lying. It wasn’t.'],
 ] },
 { by: 'mei', cat: 'Services', scope: 'extended', instinct: 'feels_off', body: 'A supplier wants a 70% deposit upfront for my first big order. Is that a normal risk for a small business, or a red flag?', echoes: 1, replies: [
  ['more_context', 'Have you worked with them before at all?'],
  ['address', 'Ask for 30% now and the rest on delivery. Their reaction is the answer.'],
 ] },
 { by: 'dilnoza', cat: 'Travel', scope: 'community', instinct: 'unsure', body: 'Got my Erasmus place in Lisbon! My visa appointment is after the semester starts. Has anyone dealt with this?', echoes: 2, replies: [
  ['address', 'Write to the international office now. They often write a letter for the embassy.'],
  ['been_there', 'Mine was late too. The university let me start online for two weeks.'],
  ['address', 'Ask the embassy if they have a cancellation list.'],
 ], outcome: ['figuring_out', 'The international office wrote a letter. Still waiting on the embassy.', null, true] },
 { by: 'katharina', cat: 'Work', scope: 'extended', instinct: 'feels_okay', body: 'Colleague keeps forwarding me his clients “because you’re better with them”. Compliment or extra work disguised as one?', echoes: 0, replies: [
  ['more_context', 'Are you paid or recognised for those clients?'],
 ] },
 { by: 'emma', cat: 'Services', scope: 'community', instinct: 'feels_off', body: 'A client is 90 days late on an invoice and now wants new work. Do I do the new work?', echoes: 7, replies: [
  ['address', 'Not until the old invoice is paid. Say so kindly.'],
  ['been_there', 'I did the new work. Was paid for neither.'],
  ['address', 'Offer to start once payment lands. Clear and friendly.'],
  ['more_context', 'Have they given any reason for the delay?'],
 ], outcome: ['boundary', 'I said I’d start once the invoice was paid. It arrived in four days.', null, true] },
 { by: 'olena', cat: 'Services', scope: 'extended', instinct: 'unsure', body: 'A pharmacy customer keeps asking me for my personal number “in case he has questions”. How do I keep saying no without being rude?', echoes: 0, replies: [
  ['address', 'Give him the pharmacy number every time. Same words, same tone.'],
 ] },
 { by: 'rania', cat: 'Everyday Life', scope: 'extended', instinct: 'feels_okay', body: 'An old school friend got in touch after ten years and wants to meet. Part of me is curious, part of me remembers how it ended.', echoes: 0, replies: [] },

 // ── Community members outside Eva's circles
 { by: 'ngozi', cat: 'Work', scope: 'community', instinct: 'unsure', body: 'An investor said he’d fund my company “if we discuss it over dinner, just us two”. He’s well respected. Am I reading too much into it?', echoes: 9, replies: [
  ['address', 'Suggest lunch at his office or bring your co-founder. If that’s a problem, you have your answer.'],
  ['more_context', 'Has he funded other women founders? Talk to them.'],
  ['been_there', 'I took a dinner like this. Nothing happened, but I spent the evening on edge.'],
  ['watch_wait', 'You can say you prefer daytime meetings and see.'],
  ['address', 'Respected doesn’t mean safe for you. Keep it professional by default.'],
  ['been_there', 'I always bring a colleague to investor meetings now. Nobody has minded.'],
 ], room: [[0, 'I suggested lunch with my co-founder.'], [1, 'Good. I wish someone had told me that early on.'], [2, 'I had a similar invitation. Bringing a colleague changed everything.'], [3, 'Let us know how lunch goes.']], outcome: ['other', 'Lunch with my co-founder went fine. He didn’t invest, and I’m okay with that.', null, true] },
 { by: 'camille', cat: 'Work', scope: 'community', instinct: 'feels_off', body: 'My PhD supervisor wants me to give my data to a postdoc so she can publish first. Is this normal in academia?', echoes: 6, replies: [
  ['more_context', 'Is there a written agreement about authorship in your lab?'],
  ['address', 'Ask for authorship order to be agreed in writing before you share.'],
  ['been_there', 'Happened to me. I was third author on my own data.'],
  ['address', 'Talk to the graduate office. This is exactly what they’re for.'],
  ['watch_wait', 'Ask for a meeting with both of them before deciding.'],
 ], outcome: ['talked', 'We agreed in writing that I’m first author on my chapter.', 'Hard conversation, useful one.', true] },
 { by: 'jessica', cat: 'Everyday Life', scope: 'community', instinct: 'feels_off', body: 'A regular at the restaurant waits outside after my shift to “say goodnight”. He’s polite. My manager says he’s harmless.', echoes: 13, replies: [
  ['address', 'Ask your manager or a colleague to walk you out for a while.'],
  ['been_there', 'We had one like this. Telling the owner directly changed things.'],
  ['address', 'Leave through another door if there is one.'],
  ['more_context', 'Does he wait for anyone else?'],
  ['address', 'Polite and harmless aren’t the same thing. You get to decide how it feels.'],
  ['been_there', 'Mine stopped after a coworker started leaving with me.'],
  ['watch_wait', 'Keep a short note of the dates, just in case.'],
  ['address', 'Your manager’s opinion doesn’t cancel your instinct.'],
  ['been_there', 'Night shifts taught me: trust the uneasy feeling first.'],
  ['address', 'Ask the restaurant to say something to him. It shouldn’t be on you.'],
  ['more_context', 'Is there anyone else on staff who closes with you?'],
  ['been_there', 'I worked bars for years. This happened twice. Both times it stopped once someone else was visibly with me.'],
  ['address', 'Text someone when you leave and when you’re home.'],
  ['watch_wait', 'If he changes the pattern after you leave with someone, that tells you something too.'],
  ['address', 'Ask your manager to put it in writing that he’s been told. Then it’s on record.'],
 ], room: [[0, 'A coworker walks out with me now. He hasn’t been back.'], [1, 'So glad. Mine was the same — one visible friend and he disappeared.'], [2, 'I needed to read this today. I have one too.'], [3, 'Please tell your manager, even if they brush it off.'], [2, 'I will.'], [4, 'Sending courage to both of you.']], outcome: ['talked', 'I spoke to the owner. Now someone walks me out, and he hasn’t come back.', null, true] },
 { by: 'ximena', cat: 'Services', scope: 'community', instinct: 'unsure', body: 'A café asked me to paint a mural and offered to pay “after the opening, depending on how it goes”. Would you take it?', echoes: 2, replies: [
  ['address', 'Half up front, the rest on completion. Not on success.'],
  ['been_there', 'Did one like this. “Depending” meant never.'],
  ['address', 'Put the price and payment date in a short written agreement.'],
 ], outcome: ['left', 'They wouldn’t agree to a deposit, so I said no.', null, true] },
 { by: 'valeria', cat: 'Travel', scope: 'community', instinct: 'feels_okay', body: 'Two weeks of fieldwork on a boat with a crew I don’t know, mostly men. Anything you’d pack or ask about beforehand?', echoes: 1, replies: [
  ['address', 'Ask who your on-board contact is and how communication works offshore.'],
  ['been_there', 'Bring a lock for your cabin and your own seasickness pills.'],
 ] },
 { by: 'beatriz', cat: 'Travel', scope: 'community', instinct: 'unsure', body: 'Hotel gave me a room key and said my room number out loud in a busy lobby. Would you ask for a different room?', echoes: 4, replies: [
  ['address', 'Yes. Quietly ask at the desk for a different room, they’ll understand.'],
  ['been_there', 'I did, and the receptionist apologised. Totally normal request.'],
  ['address', 'Ask them to write it down next time instead of saying it.'],
 ] },
 { by: 'thandiwe', cat: 'Work', scope: 'community', instinct: 'unsure', body: 'Back at work after maternity leave and my manager has given half my projects to someone else “to ease me in”. I didn’t ask for that.', echoes: 5, replies: [
  ['address', 'Tell him what you’d like back and by when. He may just be guessing.'],
  ['been_there', 'Same thing happened. I asked for a plan with dates and got my work back in a month.'],
  ['more_context', 'Did he discuss it with you before your return?'],
  ['address', 'Ask in writing so there’s a record of the conversation.'],
 ], outcome: ['figuring_out', 'I asked for a plan with dates. I have two projects back; still waiting on the rest.', null, true] },
 { by: 'khadija', cat: 'Work', scope: 'community', instinct: 'feels_okay', body: 'First job interview on Monday, for a marketing assistant role. What’s one thing you wish you’d asked in your first interview?', echoes: 0, replies: [
  ['address', 'Ask what success looks like after three months.'],
  ['been_there', 'I wish I’d asked why the last person left.'],
  ['address', 'Ask who you’d work with every day, by name.'],
  ['been_there', 'Ask about training. Mine had none and I drowned.'],
  ['address', 'And bring a printed copy of your CV. Old-fashioned but it helps.'],
 ] },
 { by: 'amani', cat: 'Everyday Life', scope: 'community', instinct: 'feels_okay', body: 'My cousin is getting married and wants me to speak at the wedding. I hate public speaking. How do I prepare without dreading it for months?', echoes: 3, replies: [
  ['address', 'Write it short. Two minutes is plenty.'],
  ['been_there', 'I practised it to my bathroom mirror ten times. Boring, works.'],
  ['address', 'One funny story, one warm sentence, raise your glass. Done.'],
 ] },
 { by: 'rosa', cat: 'Work', scope: 'community', instinct: 'unsure', body: 'A parent at school keeps messaging my personal WhatsApp about her son’s grades. I gave the number for a trip once. How do I move her back to the school email?', echoes: 1, replies: [
  ['address', 'Reply once: “Please write to my school email so I can answer properly.”'],
 ] },
 { by: 'aigerim', cat: 'Everyday Life', scope: 'community', instinct: 'feels_okay', body: 'I just moved to a new city and keep turning down invitations because I’m tired. Am I making it harder for myself?', echoes: 0, replies: [] },
];

// Between Us threads between mutual Direct Circle demo members only (never Eva): [a, b, [fromA, body][]].
export const threads: [string, string, [boolean, string][]][] = [
 ['sara', 'anna', [[true, 'Are you still coming to Tirana in October?'], [false, 'Yes! 12th to 16th.'], [true, 'Let’s get coffee. I know a place with a terrace.']]],
 ['marta', 'katharina', [[true, 'Thank you for explaining how the process works last week. It calmed me down.'], [false, 'Of course. Did you write the email?'], [true, 'Draft is ready. I’ll send it Monday.'], [false, 'Good. Keep a copy.'], [true, 'Will do.'], [false, 'And tell me how it goes.']]],
 ['claire', 'sophie', [[false, 'Saw your note on rental scams. Sending it to my cousin who’s moving to Paris.'], [true, 'Please do! Tell her to never pay before a viewing.']]],
 ['ingrid', 'freya', [[true, 'How’s the room hunt?'], [false, 'Found a sublet for two months. Small but quiet.'], [true, 'That’s a start. Want to come to choir on Thursday?'], [false, 'I can’t sing.'], [true, 'Nobody can. That’s the point.'], [false, 'Okay, I’ll come.'], [true, 'Seven o’clock, I’ll wait outside.']]],
 ['aoife', 'emma', [[true, 'Any tips for my first salary negotiation?'], [false, 'Ask for their range first. And practise saying your number out loud.'], [true, 'Out loud?'], [false, 'Honestly, it’s the hardest part. Say it to your mirror.']]],
 ['priya', 'mei', [[false, 'Saw you accepted the PhD. Congratulations!'], [true, 'Thank you! With a co-supervisor, like everyone suggested.'], [false, 'Smart. Celebrate a little.'], [true, 'Tea when you’re in Bengaluru?'], [false, 'Bringing the good kind.']]],
 ['lucia', 'rania', [[true, 'I’m in Beirut for a conference in March. Any neighbourhood you’d recommend?'], [false, 'Mar Mikhael, if you like walking. I’ll send you a list.'], [true, 'Thank you!']]],
 ['sara', 'dilnoza', [[false, 'Did you hear back about the visa?'], [true, 'Not yet. The international office sent a letter.'], [false, 'Fingers crossed. Lisbon will be great.'], [true, 'I hope so. I’m nervous about finding a room.'], [false, 'Ask Priya — she knows people who did Erasmus there.'], [true, 'Good idea, I’ll write to her.'], [false, 'And send me photos when you’re there!'], [true, 'Promise.']]],
 ['ngozi', 'amani', [[true, 'Thank you for the speech tips. You were right, two minutes was plenty.'], [false, 'Told you! How did it go?'], [true, 'People laughed at the right moment.']]],
 ['camille', 'jessica', [[false, 'Saw your note about getting home after late shifts. It helped my sister.'], [true, 'So glad. How is she doing?'], [false, 'Better. She leaves with a colleague now.'], [true, 'That’s the main thing.']]],
 ['ximena', 'valeria', [[true, 'How was the boat?'], [false, 'Seasick for two days, then wonderful. The crew were kind.'], [true, 'Photos please!'], [false, 'Sending a whale.'], [true, 'I’m painting that whale.'], [false, 'Ha. Deal.']]],
 ['zeynep', 'sara', [[true, 'Do you have a moment to look at my CV before Friday?'], [false, 'Send it over. I’ll look tonight.'], [true, 'Thank you, really.'], [false, 'Moved your projects to the top. Much stronger.'], [true, 'Got the interview!'], [false, 'Of course you did.'], [true, 'Coffee on me when you’re in Istanbul.'], [false, 'I’m holding you to that.'], [true, 'Any time.'], [false, 'And good luck Friday.']]],
];

// Private Wingwoman sessions for demo accounts only. Two (priya, aoife) were later reshaped into their own Ripples above.
export type SeedSession = { by: string; title: string; context: 'Dating' | 'Work' | 'Friendship' | 'Family' | 'Other'; instinct: 'feels_okay' | 'unsure' | 'feels_off' | null; situation: string; reflection: { what_stands_out: string[]; questions: string[]; next_step: string }; turns: ['user' | 'assistant', string][] };
export const sessions: SeedSession[] = [
 { by: 'priya', title: 'A PhD supervisor who goes quiet, then urgent', context: 'Work', instinct: 'feels_off', situation: 'I was offered the PhD position I wanted, but the supervisor takes weeks to answer and then suddenly needs things the same day.', reflection: { what_stands_out: ['You really want this position.', 'The communication pattern has been uneven from the start.', 'You haven’t met him in person yet.'], questions: ['What would you need to see to feel settled about him?', 'Who could tell you what working with him is like?'], next_step: 'You might ask to speak with one or two of his current students before you decide.' }, turns: [
  ['user', 'I think I’m scared that if I ask questions he’ll withdraw the offer.'], ['assistant', 'That fear makes sense when it’s something you really want. Asking how supervision works is a normal question though — a reasonable supervisor expects it. What would you most want to know?'],
  ['user', 'How often we’d meet. And whether he reads drafts.'], ['assistant', 'Those are exactly the right questions, and you can ask them plainly. His current students will probably give you the most honest version.'],
  ['user', 'Maybe I could ask other women what they’d do.'], ['assistant', 'That sounds like a good idea. You could share it as a Trust Ripple, in your own words — only what you choose to write would be shared.'],
 ] },
 { by: 'aoife', title: 'Comments about my lunch at work', context: 'Work', instinct: 'feels_off', situation: 'My new manager comments on my food every day at lunch. It’s small, but it makes me not want to eat in the kitchen.', reflection: { what_stands_out: ['It happens every day.', 'It’s changing where you eat.', 'You’re new and unsure what’s normal there.'], questions: ['What would you like him to stop doing?', 'Is there a short sentence you’d feel okay saying?'], next_step: 'You might try one short, calm sentence the next time it happens.' }, turns: [
  ['user', 'Everyone laughs when he does it. So maybe it’s just me.'], ['assistant', 'I can see why that would make you doubt yourself. Others laughing doesn’t tell you how they feel about it — and it doesn’t change how it feels to you.'],
  ['user', 'I just don’t want to be the difficult new person.'], ['assistant', 'That’s a really common worry. A short, light sentence isn’t difficult — it’s clear. Something like “I’d rather not talk about my food” and then moving on.'],
 ] },
 { by: 'claire', title: 'Writing for free for an editor I like', context: 'Work', instinct: 'unsure', situation: 'An editor I respect asked me to write for free. I’ve freelanced for eight years and I don’t know how to say no to someone I like.', reflection: { what_stands_out: ['You like and respect this editor.', 'You have years of experience.', 'Saying no feels personal here.'], questions: ['What would a yes cost you?', 'Is there a version of yes that would feel fair?'], next_step: 'You might reply warmly with your rate and let her decide.' }, turns: [] },
 { by: 'marta', title: 'Always the one who babysits', context: 'Family', instinct: 'unsure', situation: 'My sister leaves her kids with me at the last minute nearly every week. I love them but I’m tired and starting to feel resentful.', reflection: { what_stands_out: ['This happens almost every week.', 'You love the children.', 'Resentment is starting to build.'], questions: ['What would a fair arrangement look like to you?', 'When could you talk to her calmly?'], next_step: 'You could think about which days genuinely work for you before talking to her.' }, turns: [
  ['user', 'If I say no she’ll say I don’t care about the kids.'], ['assistant', 'That would hurt to hear. It might help to separate the two things: caring about them, and needing notice. You can say both in one breath.'],
  ['user', 'Maybe I offer Tuesdays and Thursdays.'], ['assistant', 'That sounds generous and clear. Offering fixed days often lands better than a no on its own.'],
  ['user', 'Okay. I’ll tell her on Sunday.'], ['assistant', 'Sunday sounds good — calm, not on the doorstep. I hope it goes gently.'],
 ] },
 { by: 'sara', title: 'Should I move back to Milan for a year?', context: 'Other', instinct: 'feels_okay', situation: 'I moved home to Tirana last year after four years in Milan. Now I’m offered a one-year contract back there and I can’t tell if it’s a step back.', reflection: { what_stands_out: ['It’s a one-year contract, not a permanent move.', 'You know Milan already.', 'The “step back” framing is your own worry.'], questions: ['What pulled you home in the first place?', 'What would this year give you?'], next_step: 'You might write down what each option would give you in a year’s time.' }, turns: [
  ['user', 'I came home because I was lonely. But I miss the work.'], ['assistant', 'That’s an important thing to separate. If you went back, what would be different about the loneliness this time?'],
  ['user', 'I know people now. And it’s only a year.'], ['assistant', 'That does change things. A known city, a fixed end date — it sounds less like going back and more like a chosen chapter.'],
  ['user', 'I like “chosen chapter”.'], ['assistant', 'It sounds like you might already be leaning one way. It’s okay to give it a few more days.'],
  ['user', 'I’ll talk to my mother first.'], ['assistant', 'That sounds like a good next step.'],
 ] },
 { by: 'emma', title: 'A friend who only calls when she needs something', context: 'Friendship', instinct: 'unsure', situation: 'An old friend only gets in touch when she needs a favour. Last week it was a reference for a job.', reflection: { what_stands_out: ['There is a pattern over time.', 'The requests are real favours.', 'You’re questioning the friendship, not just the favour.'], questions: ['What do you still value in this friendship?', 'Would you like to say something to her?'], next_step: 'You might decide on this favour separately from the bigger question.' }, turns: [
  ['user', 'I wrote the reference. I just felt used afterwards.'], ['assistant', 'That feeling is worth listening to. Doing a kind thing and feeling used afterwards can both be true.'],
 ] },
 { by: 'francesca', title: 'Second date and he keeps checking his phone', context: 'Dating', instinct: 'feels_okay', situation: 'Second date with someone nice, but he checked his phone constantly. He apologised and said it was work.', reflection: { what_stands_out: ['He noticed and apologised.', 'Otherwise you describe him as nice.', 'It’s only the second date.'], questions: ['Did his explanation feel believable to you?', 'What would make a third date feel worth it?'], next_step: 'You might see whether it happens again before deciding.' }, turns: [] },
 { by: 'thandiwe', title: 'Going back to work after maternity leave', context: 'Work', instinct: 'unsure', situation: 'My manager gave away half my projects while I was on leave and says it’s to ease me in. I didn’t ask for that.', reflection: { what_stands_out: ['The decision was made without you.', 'He frames it as kindness.', 'You want your work back.'], questions: ['Which projects matter most to you?', 'What timeline would feel fair?'], next_step: 'You might ask for a short plan with dates for getting your projects back.' }, turns: [
  ['user', 'I don’t want to seem ungrateful.'], ['assistant', 'Asking for your own work back isn’t ungrateful. You can thank him for the thought and still be clear about what you want.'],
  ['user', 'I’ll ask for a plan.'], ['assistant', 'A plan with dates sounds practical — and it gives you both something to check in on.'],
 ] },
];

/** Letters from the Other Side: matched to a Ripple by the start of its body. Writer 0 = the Ripple's author (only after a shared outcome); n = the nth echoer. */
export const letterSeeds: { start: string; letters: [number, string, string | null][] }[] = [
 { start: 'My manager keeps messaging me after 9pm', letters: [
  [1, 'I used to sleep with my phone face-up, waiting for his name. What I wish someone had told me: answering at 11pm doesn’t make you more valuable, it just teaches everyone that you will. The first morning I replied at 8:30 I felt sick. Nothing happened. Nothing ever happened.', 'two years later'],
  [2, 'You are not being difficult by having evenings. It took me far too long to believe that. Be kind to yourself while you find your words.', null],
 ] },
 { start: 'My sister keeps leaving her kids with me', letters: [
  [1, 'I was the “yes” sister for years. Saying “Thursday works, today doesn’t” felt like betrayal the first time. My sister was quiet for a week. Then she started asking earlier. Love survived the limit — it actually got softer.', 'about a year on'],
 ] },
 { start: 'Three weeks into my first job', letters: [
  [0, 'Writing this to whoever is where I was. I said one calm sentence and my hands shook. It was awkward for a day, then it was simply over. You don’t need the perfect wording, just a true one.', 'a few months later'],
  [2, 'I never said anything in my first job and I still replay it. Whatever you decide, the discomfort you feel is information, not oversensitivity.', 'eight years later'],
 ] },
];

// Original fictional tester scenarios; not real events, reviews, or quotes from a television script.
// Every author, commenter and situation below is invented for the demo. Buildathon jokes are fictional, never about a real event.
export type TesterDiscussion = {
 by: string; identity: 'named' | 'anonymous'; scope: 'circle' | 'extended' | 'community'; cat: string; body: string;
 // responses: [author, perspective tag (anonymous only), body]
 responses: readonly (readonly [string, string | null, string])[];
 likes?: readonly number[]; // likes per response index
 echoes?: number; // anonymous only
 letter?: readonly [string, string, string | null, boolean]; // Star Letter: status, summary, private note, shared
};
export const testerScenario = {
 email: 'blair.demo@example.com',
 direct: ['sophie', 'emma', 'francesca', 'ngozi'],
 extended: 'claire', incoming: 'camille', outgoing: 'beatriz',
 helpers: ['sophie', 'emma', 'francesca', 'ngozi', 'claire', 'camille', 'beatriz', 'maya', 'lina', 'sofia', 'noor', 'iris', 'june', 'sara', 'marta', 'priya', 'zeynep', 'giulia', 'amira', 'elena'],
 discussions: [
  // ── Open / named Ripples: social, funny, safe to sign ──
  { by: 'blair', identity: 'named', scope: 'community', cat: 'Work', body: 'Three coffees, two panic attacks, one working demo. Buildathon weekend nearly took me out. What is your strangest deadline ritual? Asking for a friend. The friend is me.', likes: [9, 4, 12, 2], responses: [
   ['sophie', null, 'I rename the file FINAL, FINAL2, FINAL_real, and then present FINAL2 by mistake. Every single time.'],
   ['emma', null, 'I iron something. I hate ironing. It tricks my brain into thinking the deadline is the lesser evil.'],
   ['maya', null, 'I once deployed from an airport bathroom. I am not proud. The demo worked.'],
   ['priya', null, 'Complete silence, one playlist on loop, and a banana at 3 a.m. The banana is load-bearing.'],
  ] },
  { by: 'sophie', identity: 'named', scope: 'community', cat: 'Work', body: 'What is the most unhinged thing you have ever done to meet a deadline? Confession hour. No judgment, only solidarity.', likes: [7, 3, 11, 5, 6], responses: [
   ['blair', null, 'Rewrote the entire homepage at 1 a.m. because the old one “had no soul”. It had a soul. I had no sleep.'],
   ['emma', null, 'Paid for premium wifi on a train to fix a build. The train ride was 40 minutes.'],
   ['zeynep', null, 'I debugged on my phone in a wedding queue. I was in the wedding.'],
   ['lina', null, 'Submitted with a typo in the title slide and simply presented with total confidence. Nobody mentioned it. I think about it weekly.'],
   ['june', null, 'Cried for exactly four minutes, set a timer, then kept going. Recommend the timer.'],
  ] },
  { by: 'emma', identity: 'named', scope: 'community', cat: 'Dating & Boundaries', body: 'What is the most suspiciously specific excuse a man has ever given you? Mine said he could not text because his phone was “updating”. For a week.', likes: [10, 8, 6, 13], responses: [
   ['blair', null, '“I am bad with phones” — sent from his phone, with perfect grammar, at 2 a.m.'],
   ['francesca', null, 'He said he was “off grid”. He has a smartwatch.'],
   ['camille', null, 'Mine claimed his flat had “a no-phone rule after ten”. Sir, you live alone.'],
   ['sofia', null, 'The bar is in the basement and somehow they still trip over it.'],
  ] },
  { by: 'francesca', identity: 'named', scope: 'community', cat: 'Dating & Boundaries', body: 'Green flag or bare minimum? He texts when he says he will, he actually listens, and he remembered my coffee order. My friends are acting like he discovered fire.', likes: [9, 5, 4], responses: [
   ['ngozi', null, 'Bare minimum with good PR. Keep him, but everybody calm down.'],
   ['blair', null, 'Remembering a coffee order is not a personality. It is a receipt.'],
   ['amira', null, 'The sad part is this genuinely is rare. Celebrate quietly, recalibrate loudly.'],
  ] },
  { by: 'ngozi', identity: 'named', scope: 'community', cat: 'Work', body: 'Office survival rule: never trust the phrase “quick call”. What is yours?', likes: [14, 3, 8, 6], responses: [
   ['blair', null, '“Quick call” is corporate for cancel your evening.'],
   ['marta', null, 'Never eat lunch at your desk on a Friday. It signals availability you do not have.'],
   ['claire', null, 'If the meeting invite has no agenda, the agenda is you.'],
   ['june', null, 'Any sentence starting “as per my last email” means war.'],
  ] },
  { by: 'maya', identity: 'named', scope: 'community', cat: 'Work', body: 'What corporate phrase instantly ruins your day? Mine is “let’s circle back”, which means your idea dies alone in a field somewhere.', likes: [11, 7, 4], responses: [
   ['blair', null, '“We’re a family here.” Families do not hold quarterly performance reviews.'],
   ['sofia', null, '“Move fast and break things.” The things were my weekends.'],
   ['noor', null, '“Just a quick favour.” There is no such thing. There is only labour with a bow on it.'],
  ] },
  { by: 'claire', identity: 'named', scope: 'extended', cat: 'Everyday Life', body: 'What is a friendship green flag nobody talks about? Mine: she tells you when you have spinach in your teeth AND when you are being dramatic.', likes: [8, 5], responses: [
   ['blair', null, 'She remembers the names of your enemies. All of them. In order.'],
   ['iris', null, 'She can sit in silence with you. No performing, no filling the air.'],
  ] },
  { by: 'giulia', identity: 'named', scope: 'community', cat: 'Travel', body: 'What is the most chaotic thing that has ever happened on a girls’ trip? Ours ended with a borrowed moped, a locked rental flat, and a woman named Stefania we still talk about.', likes: [9, 4, 6, 7], responses: [
   ['amira', null, 'One of us booked the flights for the wrong month. We found out at the airport. She is no longer in charge of flights.'],
   ['elena', null, 'We adopted a hostel cat for three days and argued about its name more than the itinerary.'],
   ['blair', null, 'Two of the group stopped speaking on day one. The rest of us became Switzerland with luggage.'],
   ['sara', null, 'We missed the last train and a stranger’s grandmother fed us and lectured us in equal measure. 10/10.'],
  ] },
  { by: 'sara', identity: 'named', scope: 'community', cat: 'Housing & Moving', body: 'Moving abroad starter pack: one suitcase, three documents you did not know existed, and a personality crisis. What was in yours?', likes: [5, 6, 3], responses: [
   ['blair', null, 'A folder of printed paperwork, because every office demanded the one copy I had not printed.'],
   ['priya', null, 'Four adapters, none of them the right one. A ritual sacrifice to the electronics gods.'],
   ['lina', null, 'A photo of my old room. Cried at it twice, then got on with it.'],
  ] },
  { by: 'priya', identity: 'named', scope: 'community', cat: 'Work', body: 'Tell me your “I almost didn’t apply and then got it” story. I need the motivation and I know you all have them.', likes: [10, 6], responses: [
   ['zeynep', null, 'Applied at midnight, convinced it was pointless. It became the job that changed my career. Apply tired, apply anyway.'],
   ['blair', null, 'I almost withdrew because the panel looked intimidating. The panel was lovely. My imagination was the only hostile interviewer.'],
  ] },
  { by: 'zeynep', identity: 'named', scope: 'community', cat: 'Everyday Life', body: 'If women came with warning labels, what would yours say? Mine: “Will solve it in a spreadsheet. Do not try to stop her.”', likes: [12, 5, 9, 4, 7], responses: [
   ['blair', null, '“Caution: remembers everything you said in March.”'],
   ['sophie', null, '“May redesign your life if left unsupervised.”'],
   ['emma', null, '“Flammable under the phrase calm down.”'],
   ['marta', null, '“Will say yes. Please check with her again in a week.”'],
   ['ngozi', null, '“Runs on tea and spite. Mostly tea.”'],
  ] },

  // ── Anonymous Stars: personal, honest, with real disagreement ──
  { by: 'blair', identity: 'anonymous', scope: 'community', cat: 'Work', body: 'My teammate keeps saying “one tiny change” and then redesigning half the app. Is this collaboration or a cry for help?', echoes: 8, letter: ['boundary', 'We agreed nothing changes after 6 p.m. without a quick vote. The tiny changes got tinier.', 'She admitted she redesigns when she is nervous. Deadline week now has rules, and I have evenings.', true], responses: [
   ['sophie', 'address', 'Name it kindly once: “Tiny changes are welcome, redesigns need a conversation.” Then hold the line.'],
   ['emma', 'been_there', 'I had this teammate. We agreed nothing changes late at night without a vote. Peace was restored.'],
   ['maya', 'more_context', 'Is she redesigning because the work is weak, or because she is anxious? Those need very different answers.'],
   ['zeynep', 'watch_wait', 'If the deadline is in two days, I would let it go and talk after. Deadline week is not the week for truth.'],
  ] },
  { by: 'blair', identity: 'anonymous', scope: 'community', cat: 'Dating & Boundaries', body: 'I think I have a crush on someone I met during a hackathon and I genuinely cannot tell whether it is chemistry or sleep deprivation.', echoes: 5, letter: ['moved_forward', 'Update: it was 30% chemistry and 70% sleep deprivation. We got coffee anyway.', 'The coffee was nice. He is less mysterious when rested. So am I.', true], responses: [
   ['emma', 'more_context', 'Have you spoken outside the context of caffeine and panic? That is the actual test.'],
   ['sophie', 'watch_wait', 'Wait one full week of normal sleep. If the crush survives, it is real.'],
   ['francesca', 'been_there', 'Mine was 90% sleep deprivation. The 10% was nice though.'],
   ['ngozi', 'address', 'Get one coffee. Worst case, you have had a coffee.'],
  ] },
  { by: 'emma', identity: 'anonymous', scope: 'community', cat: 'Dating & Boundaries', body: 'He says he is “bad at texting” but somehow watches every story within three minutes.', echoes: 17, responses: [
   ['sophie', 'address', 'The technology works when he wants it to. I would believe the pattern, not the excuse.'],
   ['maya', 'watch_wait', 'I would stop performing availability and see what he does with the silence.'],
   ['ngozi', 'more_context', 'Does he show up in person? Some people are genuinely awful texters and excellent partners. Rare, but real.'],
   ['blair', 'been_there', 'I dated this man. He was not bad at texting. He was bad at priorities. I was not one.'],
  ] },
  { by: 'sophie', identity: 'anonymous', scope: 'extended', cat: 'Dating & Boundaries', body: 'My boyfriend says his female best friend is basically his sister. She does not act like his sister.', echoes: 12, letter: ['talked', 'I asked for specifics instead of reassurance. The specifics were illuminating.', 'He was more defensive than the situation required. I am watching less, and noticing more.', false], responses: [
   ['emma', 'address', 'Ask for specifics, not reassurance. What do they do together, how does he act afterwards? Facts over vibes.'],
   ['francesca', 'more_context', 'How does she act with you? A real sister-figure makes an effort with the girlfriend.'],
   ['maya', 'been_there', 'I ignored this once. She was not his sister. Trust the data your stomach is collecting.'],
   ['ngozi', 'watch_wait', 'Watch how he handles you saying it makes you uncomfortable. His reaction is the answer.'],
  ] },
  { by: 'francesca', identity: 'anonymous', scope: 'community', cat: 'Dating & Boundaries', body: 'He has a girl best friend, a work wife and a gym wife. At what point am I part of the shareholders?', echoes: 8, responses: [
   ['emma', 'address', 'Respectfully, that man has too many departments. I would ask why every role in his life is gendered.'],
   ['sophie', 'more_context', 'Are these his jokes or theirs? If he jokes about it, he knows exactly what he is doing.'],
   ['blair', 'been_there', 'I support women’s rights and women’s wrongs, but maybe not this one. I left. The portfolio rebalanced itself.'],
  ] },
  { by: 'ngozi', identity: 'anonymous', scope: 'community', cat: 'Dating & Boundaries', body: 'The guy I’m dating follows 3,000 women and 11 men. I would like the jury’s opinion.', echoes: 12, responses: [
   ['emma', 'watch_wait', 'The follow list is not a crime, but I understand the ick. Watch whether his behaviour matches.'],
   ['sophie', 'address', 'I would joke about it once and watch his face. Defensive tells you more than the number.'],
   ['maya', 'been_there', 'The jury has deliberated: we also checked. Twice. You are normal.'],
   ['claire', 'more_context', 'Is it possibly work — photographer, recruiter, something? Context before sentencing.'],
  ] },
  { by: 'maya', identity: 'anonymous', scope: 'community', cat: 'Work', body: 'My coworker told me she hates office gossip and then gave me a 40-minute presentation of office gossip.', echoes: 3, responses: [
   ['sophie', 'watch_wait', 'People who announce they hate gossip are usually the broadcast tower. Enjoy, contribute nothing.'],
   ['emma', 'more_context', 'Does she gossip kindly or cruelly? One is small talk, the other is a warning.'],
   ['blair', 'been_there', 'Mine did this and then quoted me out of context a month later. I now nod and discuss weather.'],
  ] },
  { by: 'blair', identity: 'anonymous', scope: 'extended', cat: 'Work', body: 'My manager keeps calling me “young lady” in meetings and never speaks that way to the men.', echoes: 5, letter: ['boundary', 'I corrected him once, warmly, in front of everyone: “It’s Blair.” He has used my name ever since.', 'Funny how one calm sentence can do what six months of wincing could not.', true], responses: [
   ['claire', 'address', 'Correct it once, publicly and lightly: “It’s Blair.” Said warmly, it lands as a boundary, not a scene.'],
   ['sophie', 'been_there', 'I started answering only to my surname. He adjusted within a week.'],
   ['emma', 'more_context', 'Is he like this with younger men in any form? If yes it is habit; if no it is hierarchy.'],
  ] },
  { by: 'sara', identity: 'anonymous', scope: 'community', cat: 'Work', body: 'A coworker keeps presenting my ideas as if they appeared to him in a dream. Would you address it publicly or privately?', echoes: 8, letter: ['boundary', 'I started documenting everything before meetings. Funny how quickly “our idea” became “your idea” again.', 'I also claim my ideas out loud now, cheerfully, the moment they appear. He has stopped dreaming.', true], responses: [
   ['zeynep', 'address', 'Publicly but sweetly: “Glad that landed — I have the doc if anyone wants the detail.” Instant citizenship of your own idea.'],
   ['blair', 'been_there', 'Document, document, document. Then a private word. Then public credit-claiming if it continues.'],
   ['maya', 'more_context', 'Does he do it to others? A pattern changes how safe a private conversation is.'],
   ['ngozi', 'watch_wait', 'First time, let it go and start a paper trail. Second time, it is a strategy meeting.'],
  ] },
  { by: 'amira', identity: 'anonymous', scope: 'community', cat: 'Work', body: 'I found out everyone from work has a group chat except me. Do I care? Unfortunately, yes.', echoes: 12, responses: [
   ['sophie', 'been_there', 'This happened to me and it genuinely stung. I asked one person I trusted; it turned out to be a leftover chat from an old project.'],
   ['emma', 'more_context', 'Is it a work chat or a social one? Being out of the social one hurts more but means less.'],
   ['blair', 'address', 'Ask the person you like most: “Heard there is a chat, add me?” Casual. No trial.'],
   ['maya', 'watch_wait', 'Sometimes exclusion is inertia, not intent. I would build one friendship properly before diagnosing the whole group.'],
  ] },
  { by: 'elena', identity: 'anonymous', scope: 'community', cat: 'Everyday Life', body: 'My friend only calls when her relationship is collapsing, then disappears the moment they get back together.', echoes: 8, letter: ['boundary', 'I stopped being her emergency hotline. We are still friends, just with better boundaries.', 'She called last week to complain about him. I let it ring twice, then texted her a therapist’s name and a heart. Growth.', true], responses: [
   ['sophie', 'address', 'Name the pattern once, kindly: “I love you, and I notice I only hear from you in crisis.”'],
   ['maya', 'been_there', 'I was this friend once. Someone told me gently and I was mortified. It fixed things.'],
   ['emma', 'watch_wait', 'I would lower my investment to match hers and see whether she notices.'],
   ['blair', 'more_context', 'Is she okay otherwise? Sometimes the crisis calls are the only time she feels allowed to need people.'],
  ] },
  { by: 'camille', identity: 'anonymous', scope: 'community', cat: 'Dating & Boundaries', body: 'My best friend hates every guy I date. Either she has incredible intuition or she is the problem.', echoes: 5, responses: [
   ['emma', 'more_context', 'Has she ever been wrong about one? Track record matters here.'],
   ['sophie', 'address', 'Ask her what exactly she dislikes, in detail. Vague dislike is control; specific dislike is data.'],
   ['francesca', 'been_there', 'Mine was right four times out of four. I have stopped arguing with the oracle.'],
   ['maya', 'watch_wait', 'Notice whether she is happy when you are happy. That answers it.'],
  ] },
  { by: 'beatriz', identity: 'anonymous', scope: 'community', cat: 'Everyday Life', body: 'One girl in the group tells everybody everyone else’s secrets. Somehow we all keep telling her things.', echoes: 3, responses: [
   ['sophie', 'watch_wait', 'Every group has a radio station. The trick is knowing what not to broadcast.'],
   ['blair', 'address', 'We had a group intervention once. It worked for a month. Now we classify information by need-to-know.'],
   ['emma', 'more_context', 'Do people secretly enjoy the updates? Sometimes the group quietly votes to keep the station on air.'],
  ] },
  { by: 'giulia', identity: 'anonymous', scope: 'community', cat: 'Travel', body: 'I booked a girls’ trip and now two of them are not speaking. We leave Friday.', echoes: 2, letter: ['moved_forward', 'We survived. Two friendships did not. The hotel breakfast was excellent.', 'I stayed neutral, ate the pastries, and mediated nothing. Would neutral again.', true], responses: [
   ['amira', 'watch_wait', 'Do not mediate before Friday. Travel has a way of forcing a truce over breakfast.'],
   ['elena', 'address', 'Message both separately, neutrally, logistics only. Do not become the embassy.'],
   ['blair', 'been_there', 'I was Switzerland on this exact trip. Neutral, well-fed, exhausted. It worked.'],
  ] },
  { by: 'lina', identity: 'anonymous', scope: 'community', cat: 'Housing & Moving', body: 'My roommate’s boyfriend has slowly moved into our apartment without paying rent.', echoes: 12, letter: ['boundary', 'I finally mentioned rent and utilities. He suddenly remembered he has his own apartment.', 'The utilities spreadsheet was polite, itemised, and devastating. He now visits like a guest, not a tenant.', true], responses: [
   ['sophie', 'address', 'Address it with her, not him: “He is here five nights a week — we need to talk about bills.” Facts, not feelings about him.'],
   ['maya', 'been_there', 'I counted his showers out of spite. Then I sent a utilities breakdown. He started paying.'],
   ['emma', 'more_context', 'Is she on the lease with you? That changes how firm you can be.'],
   ['blair', 'watch_wait', 'Give it one conversation before the spreadsheet. If nothing changes, spreadsheet.'],
  ] },
  { by: 'iris', identity: 'anonymous', scope: 'community', cat: 'Everyday Life', body: 'I moved abroad and everyone thinks I’m living my dream. I’m actually lonely and too embarrassed to admit it.', echoes: 17, letter: ['talked', 'I told my sister the truth instead of posting another sunset. She called me crying, then we laughed for an hour.', 'The city is still quiet, but I have one recurring Tuesday thing now. It is small and it is mine.', true], responses: [
   ['sophie', 'been_there', 'Month two abroad was the loneliest of my life. It passed. Join one recurring thing — same people, same time, every week.'],
   ['emma', 'more_context', 'Is it missing people, or missing being known? For me it was the second, and it takes longer to fix.'],
   ['maya', 'address', 'Tell one person back home the truth. Saying it out loud shrank it for me.'],
   ['blair', 'watch_wait', 'I gave myself a rule: no verdicts before six months. The city changed around month four.'],
  ] },
  { by: 'june', identity: 'anonymous', scope: 'community', cat: 'Work', body: 'I got the job I wanted, but the interview vibe was weird enough that I’m considering saying no.', echoes: 8, letter: ['left', 'I declined it. Two weeks later I heard from someone who worked there. My instinct was doing overtime.', 'Apparently three people left that team in a year. The vibe had a résumé.', true], responses: [
   ['sophie', 'more_context', 'What exactly was weird? Specific moments are worth listing before you decide.'],
   ['emma', 'been_there', 'I ignored a weird vibe once. The vibe turned out to be the job description. Trust it.'],
   ['maya', 'address', 'Ask for a follow-up call with your future team. Weird either confirms or dissolves.'],
   ['ngozi', 'watch_wait', 'A weird feeling plus a good offer is still data. Sleep on it twice.'],
  ] },
  { by: 'noor', identity: 'anonymous', scope: 'community', cat: 'Work', body: 'My friend and I applied for the same opportunity. I got it. She hasn’t spoken to me since.', echoes: 5, responses: [
   ['sophie', 'watch_wait', 'Give her a few weeks. Grief about a rejection is real even when she loves you.'],
   ['emma', 'address', 'I would send one warm message with no apology in it. You are allowed to have won.'],
   ['maya', 'been_there', 'I was the one who lost, once. I needed a month. We are fine now, but I needed that month.'],
   ['blair', 'more_context', 'Did she know you had applied? Surprises make this so much worse.'],
  ] },
  { by: 'blair', identity: 'anonymous', scope: 'community', cat: 'Dating & Boundaries', body: 'I checked his LinkedIn because I refused to check his Instagram. Somehow this feels worse.', echoes: 3, letter: ['other', 'I discovered nothing useful except that he has endorsed 47 people for Leadership.', 'Forty-seven. I closed the app and went outside.', true], responses: [
   ['sophie', 'been_there', 'LinkedIn stalking is unhinged behaviour and I have also done it. Solidarity.'],
   ['emma', 'watch_wait', 'The research phase is normal. Just do not let it replace actual information from actual dates.'],
  ] },
  { by: 'blair', identity: 'anonymous', scope: 'circle', cat: 'Everyday Life', body: 'Spotted: me, ignoring my own advice again. I told three women this month to rest, then answered emails at midnight. What is one piece of your own advice you are currently failing to take?', echoes: 1, responses: [
   ['sophie', 'been_there', '“Not my circus” — I say it daily. I am always in the circus.'],
   ['emma', 'address', 'I tell everyone to just ask for clarification. I personally prefer to suffer in ambiguity.'],
  ] },
  { by: 'marta', identity: 'anonymous', scope: 'community', cat: 'Dating & Boundaries', body: 'He said “let’s not label it” and then introduced me as his girlfriend to his roommate.', echoes: 2, responses: [
   ['sophie', 'more_context', 'Men who avoid labels but use them when convenient want the benefits without the conversation.'],
   ['maya', 'address', 'I would ask, cheerfully: “So which is it?” His discomfort will be informative.'],
  ] },
 ] as TesterDiscussion[],
 threads: [
  ['sophie', ['Are we still pretending we understand the presentation requirements?', 'Completely. I nodded in the meeting and everything.', 'Coffee after the deadline? Assuming we survive.', 'If we do not survive, I have left instructions for the demo.']],
  ['emma', ['Please tell me I am not the only person who changed the homepage six times.', 'Seven. I changed it seven times. The sixth was a mistake.']],
  ['francesca', ['I saw your post about moving — sending you the landlord checklist.', 'You are a hero. The deposit clause alone saved me.']],
  ['ngozi', ['Spotted: someone eating an entire croissant during the rehearsal. It was me. No regrets.', 'The croissant understood the assignment.']],
 ] as [string, string[]][],
 picks: [
  ['Food & Drink', 'The café that saved my thesis', 'Fictional spot with bottomless filter coffee, forgiving staff, and a corner table that has seen three deadlines and one small breakdown.', 'Demo city'],
  ['Travel', 'Actually good airport coffee', 'Fictional kiosk by gate B. The espresso is honest and the barista has never once rushed me.', 'Demo airport'],
  ['Services', 'A coworking place where nobody takes calls on speaker', 'Fictional space with actual silence, strong wifi, and a no-speakerphone rule that is genuinely enforced.', 'Demo city'],
  ['Health & Care', 'The dentist who did not financially traumatize me', 'Fictional clinic. She showed me every X-ray, quoted before touching anything, and did not invent six fillings.', 'Demo city'],
  ['Housing & Moving', 'My emergency moving-abroad checklist', 'Fictional template: documents, deposits, and the one adapter you will definitely forget. Shared with love.', 'Online · fictional'],
  ['Everyday Life', 'Best place to sit alone with a laptop and reconsider your career', 'Fictional reading room, third floor. Good light, no small talk, excellent for dramatic life planning.', 'Demo library'],
 ],
 wingwoman: [
  { title: 'Crush or sleep deprivation?', context: 'Dating', instinct: 'unsure', situation: 'I met someone at a buildathon and cannot tell if the spark is real or just three nights of no sleep and shared panic.', reflection: { what_stands_out: ['You met under unusual, high-pressure circumstances.', 'You are already questioning the feeling, which shows good instinct.', 'There is no urgency to decide anything.'], questions: ['Have you talked about anything other than the project?', 'What would a normal, rested first coffee look like?'], next_step: 'You might wait for one ordinary week of sleep, then suggest a low-stakes coffee and see what is left of the spark.' }, turns: [
   ['user', 'But what if the spark expires before I catch up on sleep?'], ['assistant', 'A spark that only survives on sleep deprivation was probably the sleep deprivation. The real thing tends to keep. What is the smallest, easiest way to find out?'],
   ['user', 'Coffee, I guess. One coffee.'], ['assistant', 'One coffee sounds exactly right. Low stakes, good data, and if nothing else you will have had a coffee.'],
  ] },
  { title: 'The “quick call” that ate my evening', context: 'Work', instinct: 'feels_off', situation: 'A colleague keeps scheduling “quick calls” at 6 p.m. that run ninety minutes. I have plans I keep cancelling.', reflection: { what_stands_out: ['The calls are repeatedly longer than promised.', 'They land at the end of your day.', 'You keep cancelling your own plans.'], questions: ['What would you want the default to be instead?', 'Is there a sentence you could send before the next one?'], next_step: 'You might try: “Happy to talk — I have a hard stop at 6:30.” Said once, calmly, it usually resets the pattern.' }, turns: [] },
 ] as { title: string; context: string; instinct: string; situation: string; reflection: { what_stands_out: string[]; questions: string[]; next_step: string }; turns: [string, string][] }[],
} as const;
