const supabase = require('../../config/db');
const { updateInterests } = require('./helper');

class User {

    static async findAll() {
        const { data, error } = await supabase
            .from('users')
            .select('*');
        if (error) console.log(error);
        return data;
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) console.log(error);
        return data;
    }

    static async create(userData) {
        const { data, error } = await supabase
            .from('users')
			.insert(userData)
            .select();
        if (error) console.log(error);
        return data;
    }

    static async update(userData) {
		let result = {};
		const interests = userData.interests;
		const photos = userData.photos;
		delete userData.photos;
		delete userData.interests;

        const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', id)
			.select();

		if (error) {
			console.log(error);
			result.userError = error;
		} else {
			result.userData = data;
		}

		if (interests && Array.isArray(interests)) {
			await updateInterests(id, interests, result);
		}

		if (photos && Array.isArray(photos)) {
			await updatePhotos(id, photos, result);
		}

    }

    static async delete(id) {
        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        if (error) console.log(error);
        return data;
    }
}

module.exports = User;