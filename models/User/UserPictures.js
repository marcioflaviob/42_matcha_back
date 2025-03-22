const supabase = require('../../config/db');

class UserPictures {
    static async findByUserId(userId) {
        const { data, error } = await supabase
            .from('user_pictures')
            .select('*')
            .eq('user_id', userId);
            
        if (error) console.log(error);
        return data;
    }
    
    static async create(pictureData) {
        const { data, error } = await supabase
            .from('user_pictures')
            .insert(pictureData)
            .select();
            
        if (error) console.log(error);
        return data ? data[0] : null;
    }
    
    static async delete(userId, pictureId) {
        const { data, error } = await supabase
            .from('user_pictures')
            .delete()
            .eq('id', pictureId)
            .eq('user_id', userId);
            
        if (error) console.log(error);
        return !error;
    }
    
    static async resetProfilePictures(userId) {
        const { error } = await supabase
            .from('user_pictures')
            .update({ is_profile: false })
            .eq('user_id', userId);
            
        if (error) console.log(error);
        return !error;
    }
    
    static async setAsProfile(userId, pictureId) {
        const { data, error } = await supabase
            .from('user_pictures')
            .update({ is_profile: true })
            .eq('id', pictureId)
            .eq('user_id', userId)
            .select();
            
        if (error) console.log(error);
        return data ? data[0] : null;
    }
    
    static async findById(pictureId) {
        const { data, error } = await supabase
            .from('user_pictures')
            .select('*')
            .eq('id', pictureId)
            .single();
            
        if (error) console.log(error);
        return data;
    }
}

module.exports = UserPictures;