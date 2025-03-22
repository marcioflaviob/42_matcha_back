const supabase = require('../../config/db');

class Interests {
	static async findAll() {
		const { data, error } = await supabase
			.from('interests')
			.select('*');
		if (error) console.log(error);
		return data;
	}

	static async findByUserId(userId) {
		const { data, error } = await supabase
			.from('user_interests')
			.select('interest_id')
			.eq('user_id', userId);
		if (error) console.log(error);
		return data;
	}
}

module.exports = Interests;