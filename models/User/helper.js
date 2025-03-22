module.exports = async function updateInterests(id, interests, result) {
	// Remove all existing interests for this user
	const { error: deleteError } = await supabase
		.from('user_interests')
		.delete()
		.eq('user_id', id);
	
	if (deleteError) {
		console.log(deleteError);
		result.interestsDeleteError = deleteError;
	}
	
	// Add the new interests
	if (interests.length > 0) {
		const interestRows = interests.map(interestId => ({
			user_id: id,
			interest_id: interestId
		}));
		
		const { data: interestData, error: insertError } = await supabase
			.from('user_interests')
			.insert(interestRows)
			.select();
		
		if (insertError) {
			console.log(insertError);
			result.interestsInsertError = insertError;
		} else {
			result.interestsData = interestData;
		}
	}
}

module.exports = async function updatePhotos(id, photos, result) {
	// Remove all existing photos for this user
	const { error: deleteError } = await supabase
		.from('user_photos')
		.delete()
		.eq('user_id', id);
	
	if (deleteError) {
		console.log(deleteError);
		result.photosDeleteError = deleteError;
	}
	
	// Add the new photos
	if (photos.length > 0) {
		const photoRows = photos.map(photoUrl => ({
			user_id: id,
			photo_url: photoUrl
		}));
		
		const { data: photoData, error: insertError } = await supabase
			.from('user_photos')
			.insert(photoRows)
			.select();
		
		if (insertError) {
			console.log(insertError);
			result.photosInsertError = insertError;
		} else {
			result.photosData = photoData;
		}
	}
}