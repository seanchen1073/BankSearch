# phone_utils.py

import phonenumbers

def format_phone_number(number, region=None):
    """
    格式化電話號碼，添加國際區號並確保格式正確。

    :param number: 需要格式化的電話號碼。
    :param region: 預設地區代碼（例如，'PH' 為菲律賓），用於解析號碼。可選，默認為 None。
    :return: 格式化後的電話號碼。
    """
    try:
        # 解析電話號碼
        parsed_number = phonenumbers.parse(number, region)
        
        # 檢查號碼是否有效
        if not phonenumbers.is_valid_number(parsed_number):
            raise phonenumbers.NumberParseException(None, "Invalid number")
        
        # 格式化電話號碼
        formatted_number = phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
        
        return formatted_number
    except phonenumbers.NumberParseException:
        # 如果解析失敗，返回原始號碼
        return number
